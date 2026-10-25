<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceLocationRequest;
use App\Http\Requests\UpdateServiceLocationRequest;
use App\Models\ServiceLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ServiceLocationController extends Controller
{
    /**
     * Store a newly created service location.
     */
    public function store(StoreServiceLocationRequest $request): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        Gate::authorize('create', [ServiceLocation::class, $workspace]);

        $location = $workspace->serviceLocations()->create($request->validated());

        return back()->with('success', "Service location {$location->name} created successfully.");
    }

    /**
     * Update the specified service location.
     */
    public function update(UpdateServiceLocationRequest $request, ServiceLocation $serviceLocation): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($serviceLocation->workspace_id === $workspace->id, 404);
        Gate::authorize('update', $serviceLocation);

        $serviceLocation->update($request->validated());

        return back()->with('success', 'Service location updated successfully.');
    }

    /**
     * Remove the specified service location.
     */
    public function destroy(Request $request, ServiceLocation $serviceLocation): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($serviceLocation->workspace_id === $workspace->id, 404);
        Gate::authorize('delete', $serviceLocation);

        $serviceLocation->delete();

        return back()->with('success', 'Service location deleted successfully.');
    }
}
