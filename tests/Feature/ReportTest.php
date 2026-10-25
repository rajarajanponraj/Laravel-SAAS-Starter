<?php

use App\Enums\WorkOrderPriority;
use App\Enums\WorkOrderStatus;
use App\Models\Customer;
use App\Models\ServiceLocation;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderStatusEvent;
use App\Models\Workspace;

test('owner can view reports dashboard with accurate metrics and workload stats', function () {
    $owner = User::factory()->create();
    $worker = User::factory()->create(['name' => 'Bob Builder']);
    $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $workspace->users()->attach($worker, ['role' => 'member']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::create([
        'workspace_id' => $workspace->id,
        'name' => 'Metro Properties',
        'company_name' => 'Metro Group',
        'status' => 'active',
    ]);
    $location = ServiceLocation::create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'name' => 'Building A',
        'address_line1' => '500 Congress Ave',
        'city' => 'Austin',
        'state' => 'TX',
        'postal_code' => '78701',
    ]);

    // Create 1 completed job (on time)
    $completedJob = WorkOrder::create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'service_location_id' => $location->id,
        'order_number' => 'WO-2026-0001',
        'title' => 'HVAC Inspection',
        'status' => WorkOrderStatus::Completed,
        'priority' => WorkOrderPriority::High,
        'assigned_to_user_id' => $worker->id,
        'due_date' => now()->addDays(2),
        'created_by_user_id' => $owner->id,
    ]);
    WorkOrderStatusEvent::create([
        'workspace_id' => $workspace->id,
        'work_order_id' => $completedJob->id,
        'user_id' => $owner->id,
        'from_status' => WorkOrderStatus::Submitted,
        'to_status' => WorkOrderStatus::Completed,
        'comment' => 'Approved',
        'created_at' => now(),
    ]);

    // Create 1 in-progress job
    WorkOrder::create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'service_location_id' => $location->id,
        'order_number' => 'WO-2026-0002',
        'title' => 'Plumbing Repair',
        'status' => WorkOrderStatus::InProgress,
        'priority' => WorkOrderPriority::Medium,
        'assigned_to_user_id' => $worker->id,
        'created_by_user_id' => $owner->id,
    ]);

    $response = $this->actingAs($owner)->get(route('reports.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/index')
        ->where('metrics.total_jobs', 2)
        ->where('metrics.completed_jobs', 1)
        ->where('metrics.in_progress_jobs', 1)
        ->where('metrics.on_time_rate', 100)
        ->has('workers', 2)
        ->has('topCustomers', 1)
    );
});

test('reports dashboard enforces tenant isolation and does not expose another workspace data', function () {
    $ownerA = User::factory()->create();
    $workspaceA = Workspace::factory()->create(['owner_id' => $ownerA->id]);
    $workspaceA->users()->attach($ownerA, ['role' => 'owner']);
    $ownerA->update(['current_workspace_id' => $workspaceA->id]);

    $ownerB = User::factory()->create();
    $workspaceB = Workspace::factory()->create(['owner_id' => $ownerB->id]);
    $workspaceB->users()->attach($ownerB, ['role' => 'owner']);

    // Workspace B customer and jobs
    $customerB = Customer::create([
        'workspace_id' => $workspaceB->id,
        'name' => 'Secret Customer B',
        'status' => 'active',
    ]);
    $locationB = ServiceLocation::create([
        'workspace_id' => $workspaceB->id,
        'customer_id' => $customerB->id,
        'name' => 'Classified Site B',
        'address_line1' => '999 Secret Rd',
        'city' => 'Austin',
        'state' => 'TX',
        'postal_code' => '78701',
    ]);
    WorkOrder::create([
        'workspace_id' => $workspaceB->id,
        'customer_id' => $customerB->id,
        'service_location_id' => $locationB->id,
        'order_number' => 'WO-B-0001',
        'title' => 'Confidential Project B',
        'status' => WorkOrderStatus::InProgress,
        'created_by_user_id' => $ownerB->id,
    ]);

    // Owner A visits reports
    $response = $this->actingAs($ownerA)->get(route('reports.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/index')
        ->where('metrics.total_jobs', 0)
        ->has('topCustomers', 0)
    );
});

test('csv export streams correct workspace records and excludes other tenants', function () {
    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::create([
        'workspace_id' => $workspace->id,
        'name' => 'Apex Facilities',
        'status' => 'active',
    ]);
    $location = ServiceLocation::create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'name' => 'Apex Tower',
        'address_line1' => '100 Apex Way',
        'city' => 'Austin',
        'state' => 'TX',
        'postal_code' => '78701',
    ]);
    WorkOrder::create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'service_location_id' => $location->id,
        'order_number' => 'WO-2026-9999',
        'title' => 'Emergency Generator Check',
        'status' => WorkOrderStatus::Completed,
        'priority' => WorkOrderPriority::Urgent,
        'created_by_user_id' => $owner->id,
    ]);

    // Other workspace record that must not leak
    $otherWorkspace = Workspace::factory()->create();
    $otherCustomer = Customer::create([
        'workspace_id' => $otherWorkspace->id,
        'name' => 'Other Corp',
        'status' => 'active',
    ]);
    $otherLocation = ServiceLocation::create([
        'workspace_id' => $otherWorkspace->id,
        'customer_id' => $otherCustomer->id,
        'name' => 'Other Site',
        'address_line1' => '555 Other St',
        'city' => 'Austin',
        'state' => 'TX',
        'postal_code' => '78701',
    ]);
    WorkOrder::create([
        'workspace_id' => $otherWorkspace->id,
        'customer_id' => $otherCustomer->id,
        'service_location_id' => $otherLocation->id,
        'order_number' => 'WO-OTHER-0001',
        'title' => 'Leak Check',
        'status' => WorkOrderStatus::Draft,
        'created_by_user_id' => $owner->id,
    ]);

    $response = $this->actingAs($owner)->get(route('reports.export'));

    $response->assertSuccessful();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

    // Capture streamed response content
    ob_start();
    $response->sendContent();
    $content = ob_get_clean();

    expect($content)->toContain('Order Number');
    expect($content)->toContain('Customer Name');
    expect($content)->toContain('WO-2026-9999');
    expect($content)->toContain('Emergency Generator Check');
    expect($content)->toContain('Apex Facilities');
    expect($content)->not->toContain('WO-OTHER-0001');
    expect($content)->not->toContain('Other Corp');
});
