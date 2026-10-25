<?php

use App\Enums\WorkOrderPriority;
use App\Enums\WorkOrderStatus;
use App\Models\Customer;
use App\Models\ServiceLocation;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderChecklist;
use App\Models\WorkOrderChecklistItem;
use App\Models\Workspace;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

test('complete crewflow end-to-end lifecycle: dispatch, worker mobile execution, evidence, checklist, supervisor review, and completion report', function () {
    // 1. Setup Workspace, Owner (Dispatcher), and Field Worker
    $dispatcher = User::factory()->create(['name' => 'Alice Dispatcher']);
    $worker = User::factory()->create(['name' => 'Charlie Technician']);
    $workspace = Workspace::factory()->create([
        'owner_id' => $dispatcher->id,
        'plan_override' => 'pro',
    ]);
    $workspace->users()->attach($dispatcher, ['role' => 'owner']);
    $workspace->users()->attach($worker, ['role' => 'member']);
    $dispatcher->update(['current_workspace_id' => $workspace->id]);
    $worker->update(['current_workspace_id' => $workspace->id]);

    // 2. Dispatcher creates Customer & Service Location
    $customerResponse = $this->actingAs($dispatcher)->post(route('customers.store'), [
        'name' => 'Highland Properties LLC',
        'email' => 'operations@highland.example',
        'phone' => '512-555-0199',
        'company_name' => 'Highland Estates',
        'notes' => 'Key code at gate is #4421',
        'status' => 'active',
    ]);
    $customerResponse->assertRedirect();
    $customer = Customer::where('name', 'Highland Properties LLC')->first();
    expect($customer)->not->toBeNull();

    $locationResponse = $this->actingAs($dispatcher)->post(route('service-locations.store'), [
        'customer_id' => $customer->id,
        'name' => 'Clubhouse HVAC Unit',
        'address_line1' => '7800 Ranch Rd',
        'city' => 'Austin',
        'state' => 'TX',
        'postal_code' => '78730',
        'access_notes' => 'Roof hatch on east side of building',
    ]);
    $locationResponse->assertRedirect();
    $location = ServiceLocation::where('customer_id', $customer->id)->first();
    expect($location)->not->toBeNull();

    // 3. Dispatcher creates a Work Order and assigns worker
    $woResponse = $this->actingAs($dispatcher)->post(route('work-orders.store'), [
        'customer_id' => $customer->id,
        'service_location_id' => $location->id,
        'title' => 'Annual HVAC Coil Cleaning & Diagnostic',
        'description' => 'Perform full condenser wash and refrigerant pressure check.',
        'priority' => WorkOrderPriority::High->value,
        'assigned_to_user_id' => $worker->id,
        'due_date' => now()->addDays(1)->format('Y-m-d'),
    ]);
    $woResponse->assertRedirect();
    $workOrder = WorkOrder::where('title', 'Annual HVAC Coil Cleaning & Diagnostic')->first();
    expect($workOrder)->not->toBeNull();
    expect($workOrder->status)->toBe(WorkOrderStatus::Assigned);
    expect($workOrder->assigned_to_user_id)->toBe($worker->id);

    // Attach standard checklist
    $checklist = WorkOrderChecklist::create([
        'workspace_id' => $workspace->id,
        'work_order_id' => $workOrder->id,
        'name' => 'HVAC Diagnostic Checklist',
    ]);
    $checkItem1 = WorkOrderChecklistItem::create([
        'work_order_checklist_id' => $checklist->id,
        'label' => 'Power down disconnect box before service',
        'type' => 'checkbox',
        'is_required' => true,
        'is_completed' => false,
        'sort_order' => 0,
    ]);
    $checkItem2 = WorkOrderChecklistItem::create([
        'work_order_checklist_id' => $checklist->id,
        'label' => 'Record refrigerant PSI reading',
        'type' => 'text',
        'is_required' => true,
        'is_completed' => false,
        'sort_order' => 1,
    ]);

    // 4. Worker views their mobile "My Jobs" page
    $workerJobsResponse = $this->actingAs($worker)->get(route('worker.jobs.index'));
    $workerJobsResponse->assertSuccessful();

    // 5. Worker starts work (transition to in_progress)
    $startResponse = $this->actingAs($worker)->put(route('work-orders.status.update', $workOrder), [
        'status' => WorkOrderStatus::InProgress->value,
        'comment' => 'Arrived on site and opened roof access.',
    ]);
    $startResponse->assertRedirect();
    expect($workOrder->fresh()->status)->toBe(WorkOrderStatus::InProgress);

    // 6. Worker completes checklist items
    $this->actingAs($worker)->put(route('work-orders.checklists.items.update', [$workOrder, $checkItem1]), [
        'is_completed' => true,
    ])->assertRedirect();

    $this->actingAs($worker)->put(route('work-orders.checklists.items.update', [$workOrder, $checkItem2]), [
        'is_completed' => true,
        'text_response' => 'Suction: 118 PSI, Liquid: 275 PSI - Normal',
    ])->assertRedirect();

    // 7. Worker uploads photo evidence of completed work
    $photo = UploadedFile::fake()->image('coils_cleaned.jpg', 800, 600);
    $uploadResponse = $this->actingAs($worker)->post(route('work-orders.evidence.store', $workOrder), [
        'file' => $photo,
        'notes' => 'Condenser coils thoroughly flushed and cleaned.',
    ]);
    $uploadResponse->assertRedirect();
    expect($workOrder->evidence()->count())->toBe(1);

    // 8. Worker submits work order for review
    $submitResponse = $this->actingAs($worker)->put(route('work-orders.status.update', $workOrder), [
        'status' => WorkOrderStatus::Submitted->value,
        'comment' => 'Job complete. All diagnostic measurements logged.',
    ]);
    $submitResponse->assertRedirect();
    expect($workOrder->fresh()->status)->toBe(WorkOrderStatus::Submitted);

    // 9. Dispatcher reviews and requests correction
    $requestChangesResponse = $this->actingAs($dispatcher)->put(route('work-orders.status.update', $workOrder), [
        'status' => WorkOrderStatus::ChangesRequested->value,
        'comment' => 'Please confirm electrical disconnect was restored to ON position.',
    ]);
    $requestChangesResponse->assertRedirect();
    expect($workOrder->fresh()->status)->toBe(WorkOrderStatus::ChangesRequested);

    // 10. Worker moves back to in_progress, verifies disconnect, and resubmits
    $this->actingAs($worker)->put(route('work-orders.status.update', $workOrder), [
        'status' => WorkOrderStatus::InProgress->value,
        'comment' => 'Returning to unit to verify disconnect.',
    ]);
    $resubmitResponse = $this->actingAs($worker)->put(route('work-orders.status.update', $workOrder), [
        'status' => WorkOrderStatus::Submitted->value,
        'comment' => 'Verified disconnect box switch is firmly ON and system test cycle running.',
    ]);
    $resubmitResponse->assertRedirect();
    expect($workOrder->fresh()->status)->toBe(WorkOrderStatus::Submitted);

    // 11. Dispatcher approves and completes job
    $approveResponse = $this->actingAs($dispatcher)->put(route('work-orders.status.update', $workOrder), [
        'status' => WorkOrderStatus::Completed->value,
        'comment' => 'Approved. Workmanship verified and signoff complete.',
    ]);
    $approveResponse->assertRedirect();
    expect($workOrder->fresh()->status)->toBe(WorkOrderStatus::Completed);

    // 12. Verify audit trail of status events
    $events = $workOrder->statusEvents()->orderBy('created_at')->get();
    expect($events->count())->toBeGreaterThanOrEqual(6);

    // 13. Completion Report renders with full persisted information
    $reportResponse = $this->actingAs($dispatcher)->get(route('work-orders.report', $workOrder));
    $reportResponse->assertSuccessful();
    $reportResponse->assertInertia(fn ($page) => $page
        ->component('work-orders/report')
        ->where('workOrder.title', 'Annual HVAC Coil Cleaning & Diagnostic')
        ->where('workOrder.status', WorkOrderStatus::Completed->value)
        ->where('workOrder.customer.name', 'Highland Properties LLC')
        ->where('workOrder.service_location.name', 'Clubhouse HVAC Unit')
        ->where('workOrder.assigned_worker.name', 'Charlie Technician')
        ->has('workOrder.checklists', 1)
        ->has('workOrder.evidence', 1)
    );
});
