<?php

use App\Models\Customer;
use App\Models\User;
use App\Models\Workspace;

test('workspace owner can list customers', function () {
    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    Customer::factory()->count(3)->create(['workspace_id' => $workspace->id]);

    $response = $this->actingAs($owner)->get(route('customers.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('customers/index')
        ->has('customers.data', 3)
    );
});

test('workspace owner can create customer', function () {
    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $payload = [
        'name' => 'Acme Property Management',
        'email' => 'contact@acme.com',
        'phone' => '555-0199',
        'company_name' => 'Acme Corp',
        'notes' => 'Primary commercial client',
    ];

    $response = $this->actingAs($owner)->post(route('customers.store'), $payload);

    $customer = Customer::where('name', 'Acme Property Management')->first();
    expect($customer)->not->toBeNull();
    expect($customer->workspace_id)->toBe($workspace->id);

    $response->assertRedirect(route('customers.show', $customer));
});

test('customer validation requires name', function () {
    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $response = $this->actingAs($owner)->post(route('customers.store'), [
        'name' => '',
    ]);

    $response->assertSessionHasErrors(['name']);
});

test('user from another workspace cannot access customer', function () {
    $workspaceA = Workspace::factory()->create();
    $ownerA = User::factory()->create();
    $workspaceA->users()->attach($ownerA, ['role' => 'owner']);
    $ownerA->update(['current_workspace_id' => $workspaceA->id]);

    $customerA = Customer::factory()->create(['workspace_id' => $workspaceA->id]);

    $workspaceB = Workspace::factory()->create();
    $userB = User::factory()->create();
    $workspaceB->users()->attach($userB, ['role' => 'owner']);
    $userB->update(['current_workspace_id' => $workspaceB->id]);

    // User B attempts to access Customer A
    $response = $this->actingAs($userB)->get(route('customers.show', $customerA));

    $response->assertNotFound();
});

test('workspace admin can update customer', function () {
    $workspace = Workspace::factory()->create();
    $admin = User::factory()->create();
    $workspace->users()->attach($admin, ['role' => 'admin']);
    $admin->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Original Name',
    ]);

    $response = $this->actingAs($admin)->put(route('customers.update', $customer), [
        'name' => 'Updated Name',
        'email' => 'updated@example.com',
    ]);

    $response->assertSessionHasNoErrors();
    expect($customer->fresh()->name)->toBe('Updated Name');
});

test('workspace owner can delete customer', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);

    $response = $this->actingAs($owner)->delete(route('customers.destroy', $customer));

    $response->assertRedirect(route('customers.index'));
    expect($customer->fresh()->trashed())->toBeTrue();
});
