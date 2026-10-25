<?php

use App\Enums\WorkOrderPriority;
use App\Enums\WorkOrderStatus;
use App\Models\Customer;
use App\Models\ServiceLocation;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\Workspace;

test('owner can create work order with auto-generated order number', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $location = ServiceLocation::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
    ]);

    $response = $this->actingAs($owner)->post(route('work-orders.store'), [
        'customer_id' => $customer->id,
        'service_location_id' => $location->id,
        'title' => 'HVAC Seasonal Maintenance',
        'description' => 'Check filters, test condenser, clean coils.',
        'priority' => WorkOrderPriority::High->value,
        'due_date' => now()->addDays(3)->toDateString(),
    ]);

    $workOrder = WorkOrder::where('title', 'HVAC Seasonal Maintenance')->first();
    expect($workOrder)->not->toBeNull();
    expect($workOrder->order_number)->toBe('WO-0001');
    expect($workOrder->status)->toBe(WorkOrderStatus::Draft);
    expect($workOrder->priority)->toBe(WorkOrderPriority::High);

    $response->assertRedirect(route('work-orders.show', $workOrder));
});

test('work order creation auto-increments order numbers in workspace', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);

    WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'order_number' => 'WO-0001',
    ]);

    $this->actingAs($owner)->post(route('work-orders.store'), [
        'customer_id' => $customer->id,
        'title' => 'Second Job',
        'priority' => WorkOrderPriority::Medium->value,
    ]);

    $secondOrder = WorkOrder::where('title', 'Second Job')->first();
    expect($secondOrder->order_number)->toBe('WO-0002');
});

test('worker only sees assigned jobs in work orders index', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);

    $workerA = User::factory()->create();
    $workspace->users()->attach($workerA, ['role' => 'member']);
    $workerA->update(['current_workspace_id' => $workspace->id]);

    $workerB = User::factory()->create();
    $workspace->users()->attach($workerB, ['role' => 'member']);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);

    // Job assigned to Worker A
    $jobA = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'assigned_to_user_id' => $workerA->id,
        'status' => WorkOrderStatus::Assigned,
    ]);

    // Job assigned to Worker B
    $jobB = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'assigned_to_user_id' => $workerB->id,
        'status' => WorkOrderStatus::Assigned,
    ]);

    $response = $this->actingAs($workerA)->get(route('work-orders.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('work-orders/index')
        ->has('workOrders.data', 1)
        ->where('workOrders.data.0.id', $jobA->id)
    );
});

test('worker from another workspace cannot view work order', function () {
    $workspaceA = Workspace::factory()->create();
    $ownerA = User::factory()->create();
    $workspaceA->users()->attach($ownerA, ['role' => 'owner']);
    $customerA = Customer::factory()->create(['workspace_id' => $workspaceA->id]);

    $jobA = WorkOrder::factory()->create([
        'workspace_id' => $workspaceA->id,
        'customer_id' => $customerA->id,
    ]);

    $workspaceB = Workspace::factory()->create();
    $userB = User::factory()->create();
    $workspaceB->users()->attach($userB, ['role' => 'owner']);
    $userB->update(['current_workspace_id' => $workspaceB->id]);

    $response = $this->actingAs($userB)->get(route('work-orders.show', $jobA));
    $response->assertNotFound();
});

test('dispatcher can assign and reassign worker and history is tracked', function () {
    $workspace = Workspace::factory()->create();
    $dispatcher = User::factory()->create();
    $workspace->users()->attach($dispatcher, ['role' => 'admin']);
    $dispatcher->update(['current_workspace_id' => $workspace->id]);

    $worker1 = User::factory()->create();
    $workspace->users()->attach($worker1, ['role' => 'member']);

    $worker2 = User::factory()->create();
    $workspace->users()->attach($worker2, ['role' => 'member']);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'status' => WorkOrderStatus::Draft,
        'assigned_to_user_id' => null,
    ]);

    // Assign worker 1
    $response = $this->actingAs($dispatcher)->post(route('work-orders.assign', $job), [
        'user_id' => $worker1->id,
        'notes' => 'Please bring ladder.',
    ]);

    $response->assertSessionHasNoErrors();
    expect($job->fresh()->assigned_to_user_id)->toBe($worker1->id);
    expect($job->fresh()->status)->toBe(WorkOrderStatus::Assigned);
    expect($job->assignments()->count())->toBe(1);

    // Reassign to worker 2
    $response = $this->actingAs($dispatcher)->post(route('work-orders.assign', $job), [
        'user_id' => $worker2->id,
        'notes' => 'Worker 1 is sick, reassigned.',
    ]);

    $response->assertSessionHasNoErrors();
    expect($job->fresh()->assigned_to_user_id)->toBe($worker2->id);
    expect($job->assignments()->count())->toBe(2);
});

test('state machine validates valid workflow transitions', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $worker = User::factory()->create();
    $workspace->users()->attach($worker, ['role' => 'member']);
    $worker->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'status' => WorkOrderStatus::Assigned,
        'assigned_to_user_id' => $worker->id,
    ]);

    // 1. Worker starts job (Assigned -> InProgress)
    $this->actingAs($worker)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::InProgress->value,
    ])->assertSessionHasNoErrors();

    expect($job->fresh()->status)->toBe(WorkOrderStatus::InProgress);

    // 2. Worker submits job (InProgress -> Submitted)
    $this->actingAs($worker)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::Submitted->value,
    ])->assertSessionHasNoErrors();

    expect($job->fresh()->status)->toBe(WorkOrderStatus::Submitted);

    // 3. Supervisor requests changes (Submitted -> ChangesRequested)
    $this->actingAs($owner)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::ChangesRequested->value,
        'comment' => 'Missing photo of electrical panel.',
    ])->assertSessionHasNoErrors();

    expect($job->fresh()->status)->toBe(WorkOrderStatus::ChangesRequested);

    // 4. Worker resumes and resubmits (ChangesRequested -> InProgress -> Submitted)
    $this->actingAs($worker)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::InProgress->value,
    ])->assertSessionHasNoErrors();

    $this->actingAs($worker)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::Submitted->value,
    ])->assertSessionHasNoErrors();

    // 5. Supervisor approves (Submitted -> Completed)
    $this->actingAs($owner)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::Completed->value,
    ])->assertSessionHasNoErrors();

    $completedJob = $job->fresh();
    expect($completedJob->status)->toBe(WorkOrderStatus::Completed);
    expect($completedJob->completed_at)->not->toBeNull();
    expect($completedJob->statusEvents()->count())->toBe(6);
});

test('worker cannot self-approve their submitted work order', function () {
    $workspace = Workspace::factory()->create();
    $worker = User::factory()->create();
    $workspace->users()->attach($worker, ['role' => 'member']);
    $worker->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'status' => WorkOrderStatus::Submitted,
        'assigned_to_user_id' => $worker->id,
    ]);

    // Worker attempts to approve job
    $response = $this->actingAs($worker)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::Completed->value,
    ]);

    $response->assertSessionHasErrors(['status']);
    expect($job->fresh()->status)->toBe(WorkOrderStatus::Submitted);
});

test('requesting changes requires comment', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'status' => WorkOrderStatus::Submitted,
    ]);

    $response = $this->actingAs($owner)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::ChangesRequested->value,
        'comment' => '',
    ]);

    $response->assertSessionHasErrors(['comment']);
});

test('invalid transition from draft to completed is rejected', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'status' => WorkOrderStatus::Draft,
    ]);

    $response = $this->actingAs($owner)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::Completed->value,
    ]);

    $response->assertSessionHasErrors(['status']);
});

test('worker my-jobs endpoint filters jobs by active and completed', function () {
    $workspace = Workspace::factory()->create();
    $worker = User::factory()->create();
    $workspace->users()->attach($worker, ['role' => 'member']);
    $worker->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);

    WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'assigned_to_user_id' => $worker->id,
        'status' => WorkOrderStatus::InProgress,
    ]);

    WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'assigned_to_user_id' => $worker->id,
        'status' => WorkOrderStatus::Completed,
        'completed_at' => now(),
    ]);

    $responseActive = $this->actingAs($worker)->get(route('worker.jobs.index', ['tab' => 'active']));
    $responseActive->assertSuccessful();
    $responseActive->assertInertia(fn ($page) => $page
        ->component('worker/my-jobs')
        ->has('jobs.data', 1)
        ->where('counts.active', 1)
        ->where('counts.completed', 1)
    );

    $responseCompleted = $this->actingAs($worker)->get(route('worker.jobs.index', ['tab' => 'completed']));
    $responseCompleted->assertSuccessful();
    $responseCompleted->assertInertia(fn ($page) => $page
        ->component('worker/my-jobs')
        ->has('jobs.data', 1)
    );
});
