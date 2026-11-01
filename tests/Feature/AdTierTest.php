<?php

use App\Models\User;
use App\Models\Workspace;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
    $this->workspace->addUser($this->user, 'owner');
    $this->user->switchWorkspace($this->workspace);
});

it('enables ads for free plan workspaces', function () {
    config(['billing.ads.enabled' => true]);

    expect($this->workspace->onFreePlan())->toBeTrue();

    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('show_ads', true)
        ->where('currentWorkspace.on_free_plan', true)
        ->has('ads_config')
    );
});

it('strictly disables ads for pro plan workspaces', function () {
    config(['billing.ads.enabled' => true]);

    $this->workspace->update(['plan_override' => 'pro']);
    $this->workspace->clearResolvedPlan();

    expect($this->workspace->fresh()->onProPlan())->toBeTrue()
        ->and($this->workspace->fresh()->onFreePlan())->toBeFalse();

    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('show_ads', false)
        ->where('currentWorkspace.on_free_plan', false)
    );
});

it('strictly disables ads for business plan workspaces', function () {
    config(['billing.ads.enabled' => true]);

    $this->workspace->update(['plan_override' => 'business']);
    $this->workspace->clearResolvedPlan();

    expect($this->workspace->fresh()->onBusinessPlan())->toBeTrue()
        ->and($this->workspace->fresh()->onFreePlan())->toBeFalse();

    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('show_ads', false)
    );
});

it('allows globally disabling ads via config even on free plan', function () {
    config(['billing.ads.enabled' => false]);

    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('show_ads', false)
    );
});
