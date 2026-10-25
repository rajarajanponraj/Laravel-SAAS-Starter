<?php

use App\Models\Customer;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderEvidence;
use App\Models\Workspace;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('worker can upload photo evidence to work order and file is stored privately', function () {
    Storage::fake('local');

    $workspace = Workspace::factory()->create();
    $worker = User::factory()->create();
    $workspace->users()->attach($worker, ['role' => 'member']);
    $worker->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'assigned_to_user_id' => $worker->id,
    ]);

    $file = UploadedFile::fake()->image('condenser_coil.jpg', 800, 600);

    $response = $this->actingAs($worker)->post(route('work-orders.evidence.store', $job), [
        'file' => $file,
        'notes' => 'Condenser cleaned with foaming solvent.',
    ]);

    $response->assertSessionHasNoErrors();
    expect($job->evidence()->count())->toBe(1);

    $evidence = $job->evidence()->first();
    expect($evidence->original_filename)->toBe('condenser_coil.jpg');
    expect($evidence->mime_type)->toBe('image/jpeg');
    expect($evidence->notes)->toBe('Condenser cleaned with foaming solvent.');

    // Assert file exists on private storage disk
    Storage::disk('local')->assertExists($evidence->storage_path);
});

test('authorized manager can download or view evidence file', function () {
    Storage::fake('local');

    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
    ]);

    $file = UploadedFile::fake()->create('report.pdf', 100, 'application/pdf');

    $this->actingAs($owner)->post(route('work-orders.evidence.store', $job), [
        'file' => $file,
    ]);

    $evidence = $job->evidence()->first();

    $response = $this->actingAs($owner)->get(route('work-orders.evidence.download', [
        'workOrder' => $job,
        'evidence' => $evidence,
    ]));

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'application/pdf');
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
});

test('user from another workspace cannot download evidence file', function () {
    Storage::fake('local');

    $workspaceA = Workspace::factory()->create();
    $ownerA = User::factory()->create();
    $workspaceA->users()->attach($ownerA, ['role' => 'owner']);
    $ownerA->update(['current_workspace_id' => $workspaceA->id]);

    $customerA = Customer::factory()->create(['workspace_id' => $workspaceA->id]);
    $jobA = WorkOrder::factory()->create([
        'workspace_id' => $workspaceA->id,
        'customer_id' => $customerA->id,
    ]);

    $file = UploadedFile::fake()->image('evidence.png', 400, 400);
    $this->actingAs($ownerA)->post(route('work-orders.evidence.store', $jobA), [
        'file' => $file,
    ]);
    $evidence = $jobA->evidence()->first();

    // User in Workspace B
    $workspaceB = Workspace::factory()->create();
    $userB = User::factory()->create();
    $workspaceB->users()->attach($userB, ['role' => 'owner']);
    $userB->update(['current_workspace_id' => $workspaceB->id]);

    $response = $this->actingAs($userB)->get(route('work-orders.evidence.download', [
        'workOrder' => $jobA,
        'evidence' => $evidence,
    ]));

    $response->assertNotFound();
});

test('invalid file types are rejected', function () {
    Storage::fake('local');

    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
    ]);

    $dangerousFile = UploadedFile::fake()->create('script.php', 10, 'application/x-php');

    $response = $this->actingAs($owner)->post(route('work-orders.evidence.store', $job), [
        'file' => $dangerousFile,
    ]);

    $response->assertSessionHasErrors(['file']);
    expect($job->evidence()->count())->toBe(0);
});

test('evidence deletion removes file from disk and database', function () {
    Storage::fake('local');

    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
    ]);

    $file = UploadedFile::fake()->image('test.jpg');
    $this->actingAs($owner)->post(route('work-orders.evidence.store', $job), [
        'file' => $file,
    ]);

    $evidence = $job->evidence()->first();
    Storage::disk('local')->assertExists($evidence->storage_path);

    $deleteResponse = $this->actingAs($owner)->delete(route('work-orders.evidence.destroy', [
        'workOrder' => $job,
        'evidence' => $evidence,
    ]));

    $deleteResponse->assertSessionHasNoErrors();
    expect(WorkOrderEvidence::find($evidence->id))->toBeNull();
    Storage::disk('local')->assertMissing($evidence->storage_path);
});
