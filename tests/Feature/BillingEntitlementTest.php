<?php

use App\Models\ChecklistTemplate;
use App\Models\Customer;
use App\Models\ServiceLocation;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderEvidence;
use App\Models\Workspace;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

test('free plan blocks work order creation after reaching monthly limit', function () {
    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create([
        'owner_id' => $owner->id,
    ]);
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::create([
        'workspace_id' => $workspace->id,
        'name' => 'Acme Corp',
        'status' => 'active',
    ]);
    $location = ServiceLocation::create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'name' => 'Main Office',
        'address_line1' => '123 Market St',
        'city' => 'Austin',
        'state' => 'TX',
        'postal_code' => '78701',
    ]);

    // Create 15 work orders in this month (Free plan limit is 15)
    for ($i = 1; $i <= 15; $i++) {
        WorkOrder::create([
            'workspace_id' => $workspace->id,
            'customer_id' => $customer->id,
            'service_location_id' => $location->id,
            'order_number' => 'WO-2026-'.str_pad((string) $i, 4, '0', STR_PAD_LEFT),
            'title' => "Existing Job {$i}",
            'status' => 'draft',
            'created_by_user_id' => $owner->id,
            'created_at' => now(),
        ]);
    }

    // Attempt to create 16th work order
    $response = $this->actingAs($owner)
        ->post(route('work-orders.store'), [
            'customer_id' => $customer->id,
            'service_location_id' => $location->id,
            'title' => 'Excess Work Order',
            'priority' => 'medium',
        ]);

    $response->assertSessionHasErrors('plan');
});

test('free plan blocks automation rule creation and pro plan permits it', function () {
    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create([
        'owner_id' => $owner->id,
    ]);
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    // Attempt to create automation rule on free plan (limit: 0)
    $response = $this->actingAs($owner)
        ->post(route('automations.store'), [
            'name' => 'Auto Notify Dispatcher',
            'trigger_event' => 'work_order.submitted',
            'action_type' => 'send_notification',
            'action_config' => ['recipient' => 'manager'],
            'is_active' => true,
        ]);

    $response->assertSessionHasErrors('plan');

    // Upgrade workspace to pro (limit: 10)
    $workspace->update(['plan_override' => 'pro']);
    $owner = $owner->fresh();

    $responsePro = $this->actingAs($owner)
        ->post(route('automations.store'), [
            'name' => 'Auto Notify Dispatcher',
            'trigger_event' => 'work_order.submitted',
            'action_type' => 'send_notification',
            'action_config' => ['recipient' => 'manager'],
            'is_active' => true,
        ]);

    $responsePro->assertSessionHasNoErrors();
    $responsePro->assertRedirect();
    expect($workspace->automationRules()->count())->toBe(1);
});

test('evidence upload is blocked when storage quota is exceeded', function () {
    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create([
        'owner_id' => $owner->id,
    ]);
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::create([
        'workspace_id' => $workspace->id,
        'name' => 'Test Corp',
        'status' => 'active',
    ]);
    $location = ServiceLocation::create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'name' => 'Site 1',
        'address_line1' => '100 Main St',
        'city' => 'Austin',
        'state' => 'TX',
        'postal_code' => '78701',
    ]);
    $workOrder = WorkOrder::create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'service_location_id' => $location->id,
        'order_number' => 'WO-2026-0001',
        'title' => 'Job 1',
        'status' => 'in_progress',
        'created_by_user_id' => $owner->id,
    ]);

    // Simulate 50MB already stored
    WorkOrderEvidence::create([
        'workspace_id' => $workspace->id,
        'work_order_id' => $workOrder->id,
        'uploaded_by_user_id' => $owner->id,
        'original_filename' => 'large_archive.zip',
        'storage_path' => 'work-orders/large_archive.zip',
        'file_size' => 50 * 1024 * 1024, // 50MB exactly
        'mime_type' => 'application/pdf',
    ]);

    $file = UploadedFile::fake()->create('more_proof.jpg', 500, 'image/jpeg');

    $response = $this->actingAs($owner)
        ->post(route('work-orders.evidence.store', $workOrder), [
            'file' => $file,
        ]);

    $response->assertSessionHasErrors('file');
});

test('custom checklist template creation is blocked on free plan when exceeding 3 templates', function () {
    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create([
        'owner_id' => $owner->id,
    ]);
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    // Create 3 existing templates
    for ($i = 1; $i <= 3; $i++) {
        ChecklistTemplate::create([
            'workspace_id' => $workspace->id,
            'name' => "Template {$i}",
            'is_active' => true,
        ]);
    }

    // Attempt to create 4th template
    $response = $this->actingAs($owner)
        ->post(route('checklist-templates.store'), [
            'name' => '4th Template',
            'items' => [
                ['label' => 'Check circuit breaker', 'type' => 'checkbox', 'is_required' => true],
            ],
        ]);

    $response->assertSessionHasErrors('plan');
});
