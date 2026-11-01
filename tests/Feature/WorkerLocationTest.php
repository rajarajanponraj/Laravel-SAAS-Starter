<?php

use App\Models\Customer;
use App\Models\ServiceLocation;
use App\Models\User;
use App\Models\WorkerLocation;
use App\Models\WorkOrder;
use App\Models\Workspace;

beforeEach(function () {
    $this->workspace = Workspace::factory()->create();
    $this->owner = User::factory()->create(['current_workspace_id' => $this->workspace->id]);
    $this->workspace->users()->attach($this->owner->id, ['role' => 'owner']);

    $this->worker = User::factory()->create(['current_workspace_id' => $this->workspace->id]);
    $this->workspace->users()->attach($this->worker->id, ['role' => 'member']);
});

it('allows workspace member to report location ping with respective workspace', function () {
    $response = $this->actingAs($this->worker)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->postJson('/locations/ping', [
            'latitude' => 37.774929,
            'longitude' => -122.419416,
            'accuracy' => 8.5,
            'heading' => 180.0,
            'speed' => 3.2,
            'battery_level' => 82,
            'activity_type' => 'on_shift',
        ]);

    $response->assertStatus(201);
    $response->assertJson([
        'success' => true,
        'location' => [
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->worker->id,
            'activity_type' => 'on_shift',
            'battery_level' => 82,
        ],
    ]);

    $this->assertDatabaseHas('worker_locations', [
        'workspace_id' => $this->workspace->id,
        'user_id' => $this->worker->id,
        'battery_level' => 82,
        'activity_type' => 'on_shift',
    ]);
});

it('enforces multi-tenant workspace isolation for location tracking', function () {
    // Other workspace with its own technician
    $otherWorkspace = Workspace::factory()->create();
    $otherWorker = User::factory()->create(['current_workspace_id' => $otherWorkspace->id]);
    $otherWorkspace->users()->attach($otherWorker->id, ['role' => 'member']);

    // Create location in other workspace
    WorkerLocation::factory()->create([
        'workspace_id' => $otherWorkspace->id,
        'user_id' => $otherWorker->id,
        'latitude' => 40.7128,
        'longitude' => -74.0060,
    ]);

    // Create location in current workspace
    WorkerLocation::factory()->create([
        'workspace_id' => $this->workspace->id,
        'user_id' => $this->worker->id,
        'latitude' => 37.7749,
        'longitude' => -122.4194,
    ]);

    // Dispatcher in current workspace views map
    $response = $this->actingAs($this->owner)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->get('/locations/live');

    $response->assertSuccessful();
    $data = $response->json();

    expect($data['workspace_id'])->toBe($this->workspace->id);
    expect($data['locations'])->toHaveCount(1);
    expect($data['locations'][0]['user_id'])->toBe($this->worker->id);
    expect($data['locations'][0]['workspace_id'])->toBe($this->workspace->id);
});

it('validates coordinates bounds strictly', function () {
    $response = $this->actingAs($this->worker)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->postJson('/locations/ping', [
            'latitude' => 120.0, // Invalid: exceeds 90
            'longitude' => -250.0, // Invalid: exceeds -180
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['latitude', 'longitude']);
});

it('rejects work order id belonging to a different workspace', function () {
    $otherWorkspace = Workspace::factory()->create();
    $otherCustomer = Customer::factory()->create(['workspace_id' => $otherWorkspace->id]);
    $foreignWorkOrder = WorkOrder::factory()->create([
        'workspace_id' => $otherWorkspace->id,
        'customer_id' => $otherCustomer->id,
    ]);

    $response = $this->actingAs($this->worker)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->postJson('/locations/ping', [
            'latitude' => 37.7749,
            'longitude' => -122.4194,
            'work_order_id' => $foreignWorkOrder->id,
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['work_order_id']);
});

it('allows dispatchers to render the dispatch map page with workspace scoped data', function () {
    $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
    $location = ServiceLocation::factory()->create([
        'workspace_id' => $this->workspace->id,
        'customer_id' => $customer->id,
        'latitude' => 37.7833,
        'longitude' => -122.4167,
    ]);

    WorkOrder::factory()->create([
        'workspace_id' => $this->workspace->id,
        'customer_id' => $customer->id,
        'service_location_id' => $location->id,
        'assigned_to_user_id' => $this->worker->id,
        'status' => 'in_progress',
    ]);

    WorkerLocation::factory()->create([
        'workspace_id' => $this->workspace->id,
        'user_id' => $this->worker->id,
        'latitude' => 37.7749,
        'longitude' => -122.4194,
    ]);

    $response = $this->actingAs($this->owner)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->get('/locations/map');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('locations/index')
        ->has('workspace')
        ->has('latestLocations', 1)
        ->has('serviceLocations', 1)
        ->has('activeWorkOrders', 1)
        ->where('canManage', true)
    );
});

it('allows dispatchers to retrieve location history breadcrumbs for a worker', function () {
    // Create 3 historical points
    WorkerLocation::factory()->create([
        'workspace_id' => $this->workspace->id,
        'user_id' => $this->worker->id,
        'latitude' => 37.771,
        'longitude' => -122.411,
        'captured_at' => now()->subMinutes(30),
    ]);
    WorkerLocation::factory()->create([
        'workspace_id' => $this->workspace->id,
        'user_id' => $this->worker->id,
        'latitude' => 37.772,
        'longitude' => -122.412,
        'captured_at' => now()->subMinutes(15),
    ]);
    WorkerLocation::factory()->create([
        'workspace_id' => $this->workspace->id,
        'user_id' => $this->worker->id,
        'latitude' => 37.773,
        'longitude' => -122.413,
        'captured_at' => now(),
    ]);

    $response = $this->actingAs($this->owner)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->getJson("/locations/history/{$this->worker->id}");

    $response->assertSuccessful();
    $response->assertJson([
        'workspace_id' => $this->workspace->id,
        'user' => [
            'id' => $this->worker->id,
            'name' => $this->worker->name,
        ],
    ]);

    expect($response->json('points'))->toHaveCount(3);
});

it('saves service location coordinates with proper workspace isolation', function () {
    $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);

    $response = $this->actingAs($this->owner)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->post('/service-locations', [
            'customer_id' => $customer->id,
            'name' => 'HQ Job Site',
            'address_line1' => '100 Main St',
            'city' => 'San Francisco',
            'state' => 'CA',
            'postal_code' => '94105',
            'country' => 'US',
            'latitude' => 37.7905,
            'longitude' => -122.4014,
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('service_locations', [
        'workspace_id' => $this->workspace->id,
        'customer_id' => $customer->id,
        'name' => 'HQ Job Site',
        'latitude' => 37.7905,
        'longitude' => -122.4014,
    ]);
});
