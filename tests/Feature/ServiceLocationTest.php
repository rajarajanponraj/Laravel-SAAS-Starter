<?php

use App\Models\Customer;
use App\Models\ServiceLocation;
use App\Models\User;
use App\Models\Workspace;

test('can create service location for customer in workspace', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);

    $payload = [
        'customer_id' => $customer->id,
        'name' => 'Main Warehouse',
        'address_line1' => '123 Industrial Parkway',
        'city' => 'Austin',
        'state' => 'TX',
        'postal_code' => '78701',
        'access_notes' => 'Ring bell at dock 4',
    ];

    $response = $this->actingAs($owner)->post(route('service-locations.store'), $payload);

    $response->assertSessionHasNoErrors();
    $location = ServiceLocation::where('name', 'Main Warehouse')->first();
    expect($location)->not->toBeNull();
    expect($location->workspace_id)->toBe($workspace->id);
    expect($location->customer_id)->toBe($customer->id);
});

test('cannot attach service location to customer from another workspace', function () {
    $workspaceA = Workspace::factory()->create();
    $ownerA = User::factory()->create();
    $workspaceA->users()->attach($ownerA, ['role' => 'owner']);
    $ownerA->update(['current_workspace_id' => $workspaceA->id]);

    $workspaceB = Workspace::factory()->create();
    $customerB = Customer::factory()->create(['workspace_id' => $workspaceB->id]);

    // Owner of Workspace A attempts to attach location to Customer in Workspace B
    $response = $this->actingAs($ownerA)->post(route('service-locations.store'), [
        'customer_id' => $customerB->id,
        'name' => 'Cross Tenant Location',
        'address_line1' => '999 Fake Street',
        'city' => 'Nowhere',
    ]);

    $response->assertSessionHasErrors(['customer_id']);
});

test('can update service location', function () {
    $workspace = Workspace::factory()->create();
    $admin = User::factory()->create();
    $workspace->users()->attach($admin, ['role' => 'admin']);
    $admin->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $location = ServiceLocation::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'name' => 'Old Location Name',
    ]);

    $response = $this->actingAs($admin)->put(route('service-locations.update', $location), [
        'name' => 'New Location Name',
        'address_line1' => '456 Updated Ave',
        'city' => 'Dallas',
    ]);

    $response->assertSessionHasNoErrors();
    expect($location->fresh()->name)->toBe('New Location Name');
});

test('can delete service location', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $location = ServiceLocation::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
    ]);

    $response = $this->actingAs($owner)->delete(route('service-locations.destroy', $location));

    $response->assertSessionHasNoErrors();
    expect($location->fresh()->trashed())->toBeTrue();
});
