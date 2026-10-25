<?php

use App\Enums\WorkOrderStatus;
use App\Models\Customer;
use App\Models\ServiceLocation;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\Workspace;

test('supervisor review cycle: changes requested, resubmitted, approved, and completion report generated', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $worker = User::factory()->create();
    $workspace->users()->attach($worker, ['role' => 'member']);
    $worker->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $location = ServiceLocation::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
    ]);

    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'service_location_id' => $location->id,
        'assigned_to_user_id' => $worker->id,
        'status' => WorkOrderStatus::Submitted,
    ]);

    // 1. Supervisor requests changes
    $responseChanges = $this->actingAs($owner)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::ChangesRequested->value,
        'comment' => 'Please include serial number of replacement fan motor in notes.',
    ]);

    $responseChanges->assertSessionHasNoErrors();
    expect($job->fresh()->status)->toBe(WorkOrderStatus::ChangesRequested);

    // 2. Worker resumes job and resubmits
    $responseResume = $this->actingAs($worker)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::InProgress->value,
    ]);
    $responseResume->assertSessionHasNoErrors();

    $responseResubmit = $this->actingAs($worker)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::Submitted->value,
        'comment' => 'Added fan motor serial: MOT-88492-X.',
    ]);
    $responseResubmit->assertSessionHasNoErrors();
    expect($job->fresh()->status)->toBe(WorkOrderStatus::Submitted);

    // 3. Supervisor approves and marks completed
    $responseApprove = $this->actingAs($owner)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::Completed->value,
        'comment' => 'Approved. Work verified to standard.',
    ]);
    $responseApprove->assertSessionHasNoErrors();

    $completedJob = $job->fresh();
    expect($completedJob->status)->toBe(WorkOrderStatus::Completed);
    expect($completedJob->completed_at)->not->toBeNull();

    // 4. View Completion Report
    $reportResponse = $this->actingAs($owner)->get(route('work-orders.report', $job));
    $reportResponse->assertSuccessful();
    $reportResponse->assertInertia(fn ($page) => $page
        ->component('work-orders/report')
        ->where('workOrder.id', $job->id)
        ->where('workOrder.status', WorkOrderStatus::Completed->value)
    );
});
