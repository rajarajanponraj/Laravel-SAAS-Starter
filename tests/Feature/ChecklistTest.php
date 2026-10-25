<?php

use App\Enums\WorkOrderStatus;
use App\Models\ChecklistTemplate;
use App\Models\Customer;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\Workspace;

test('owner can create checklist template with required items', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $response = $this->actingAs($owner)->post(route('checklist-templates.store'), [
        'name' => 'HVAC 15-Point Inspection',
        'description' => 'Standard seasonal check for AC units.',
        'items' => [
            [
                'label' => 'Inspect and replace air filter',
                'description' => 'Check MERV rating and clean intake',
                'type' => 'checkbox',
                'is_required' => true,
                'sort_order' => 1,
            ],
            [
                'label' => 'Refrigerant pressure reading (PSI)',
                'description' => 'Record high and low side pressures',
                'type' => 'text',
                'is_required' => true,
                'sort_order' => 2,
            ],
            [
                'label' => 'Thermostat calibration verified',
                'type' => 'checkbox',
                'is_required' => false,
                'sort_order' => 3,
            ],
        ],
    ]);

    $response->assertSessionHasNoErrors();
    $template = ChecklistTemplate::where('name', 'HVAC 15-Point Inspection')->first();
    expect($template)->not->toBeNull();
    expect($template->items()->count())->toBe(3);
    expect($template->items()->where('is_required', true)->count())->toBe(2);
});

test('dispatcher can attach checklist template to work order', function () {
    $workspace = Workspace::factory()->create();
    $dispatcher = User::factory()->create();
    $workspace->users()->attach($dispatcher, ['role' => 'admin']);
    $dispatcher->update(['current_workspace_id' => $workspace->id]);

    $template = ChecklistTemplate::factory()->create(['workspace_id' => $workspace->id]);
    $template->items()->createMany([
        ['label' => 'Check oil level', 'type' => 'checkbox', 'is_required' => true, 'sort_order' => 1],
        ['label' => 'Check spark plugs', 'type' => 'checkbox', 'is_required' => false, 'sort_order' => 2],
    ]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
    ]);

    $response = $this->actingAs($dispatcher)->post(route('work-orders.checklists.store', $job), [
        'checklist_template_id' => $template->id,
    ]);

    $response->assertSessionHasNoErrors();
    expect($job->checklists()->count())->toBe(1);

    $attachedChecklist = $job->checklists()->first();
    expect($attachedChecklist->items()->count())->toBe(2);
    expect($attachedChecklist->items()->where('is_required', true)->count())->toBe(1);
});

test('assigned worker can toggle checklist items and save text response', function () {
    $workspace = Workspace::factory()->create();
    $worker = User::factory()->create();
    $workspace->users()->attach($worker, ['role' => 'member']);
    $worker->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'assigned_to_user_id' => $worker->id,
        'status' => WorkOrderStatus::InProgress,
    ]);

    $checklist = $job->checklists()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Diagnostic Checklist',
    ]);

    $checkboxItem = $checklist->items()->create([
        'label' => 'Safety switch checked',
        'type' => 'checkbox',
        'is_required' => true,
        'is_completed' => false,
    ]);

    $textItem = $checklist->items()->create([
        'label' => 'Voltage measurement',
        'type' => 'text',
        'is_required' => true,
        'is_completed' => false,
    ]);

    // 1. Toggle checkbox item
    $response1 = $this->actingAs($worker)->put(
        route('work-orders.checklists.items.update', ['workOrder' => $job, 'checklistItem' => $checkboxItem]),
        ['is_completed' => true]
    );
    $response1->assertSessionHasNoErrors();

    $checkboxItem->refresh();
    expect($checkboxItem->is_completed)->toBeTrue();
    expect($checkboxItem->completed_by_user_id)->toBe($worker->id);

    // 2. Submit text item response
    $response2 = $this->actingAs($worker)->put(
        route('work-orders.checklists.items.update', ['workOrder' => $job, 'checklistItem' => $textItem]),
        ['text_response' => 'Measured 240V steady']
    );
    $response2->assertSessionHasNoErrors();

    $textItem->refresh();
    expect($textItem->is_completed)->toBeTrue();
    expect($textItem->text_response)->toBe('Measured 240V steady');
});

test('incomplete required checklist item prevents job submission', function () {
    $workspace = Workspace::factory()->create();
    $worker = User::factory()->create();
    $workspace->users()->attach($worker, ['role' => 'member']);
    $worker->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'assigned_to_user_id' => $worker->id,
        'status' => WorkOrderStatus::InProgress,
    ]);

    $checklist = $job->checklists()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Mandatory Safety Protocol',
    ]);

    $item1 = $checklist->items()->create([
        'label' => 'Power main disconnect shut off',
        'type' => 'checkbox',
        'is_required' => true,
        'is_completed' => true,
    ]);

    $item2 = $checklist->items()->create([
        'label' => 'Pressure relief valve tested',
        'type' => 'checkbox',
        'is_required' => true,
        'is_completed' => false, // Incomplete!
    ]);

    // Worker attempts to submit job for review
    $response = $this->actingAs($worker)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::Submitted->value,
    ]);

    $response->assertSessionHasErrors(['checklist']);
    expect($job->fresh()->status)->toBe(WorkOrderStatus::InProgress);

    // Mark the remaining required item as complete
    $item2->update([
        'is_completed' => true,
        'completed_at' => now(),
        'completed_by_user_id' => $worker->id,
    ]);

    // Resubmit
    $responseSuccess = $this->actingAs($worker)->put(route('work-orders.status.update', $job), [
        'status' => WorkOrderStatus::Submitted->value,
    ]);

    $responseSuccess->assertSessionHasNoErrors();
    expect($job->fresh()->status)->toBe(WorkOrderStatus::Submitted);
});

test('cannot attach checklist template from another workspace', function () {
    $workspaceA = Workspace::factory()->create();
    $ownerA = User::factory()->create();
    $workspaceA->users()->attach($ownerA, ['role' => 'owner']);
    $ownerA->update(['current_workspace_id' => $workspaceA->id]);

    $customerA = Customer::factory()->create(['workspace_id' => $workspaceA->id]);
    $jobA = WorkOrder::factory()->create([
        'workspace_id' => $workspaceA->id,
        'customer_id' => $customerA->id,
    ]);

    // Template in Workspace B
    $workspaceB = Workspace::factory()->create();
    $templateB = ChecklistTemplate::factory()->create(['workspace_id' => $workspaceB->id]);

    $response = $this->actingAs($ownerA)->post(route('work-orders.checklists.store', $jobA), [
        'checklist_template_id' => $templateB->id,
    ]);

    $response->assertNotFound();
});
