<?php

namespace App\Policies;

use App\Models\ServiceLocation;
use App\Models\User;
use App\Models\Workspace;

class ServiceLocationPolicy
{
    /**
     * Determine whether the user can view service locations.
     */
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $workspace->hasUser($user);
    }

    /**
     * Determine whether the user can view the service location.
     */
    public function view(User $user, ServiceLocation $location): bool
    {
        return $location->workspace->hasUser($user);
    }

    /**
     * Determine whether the user can create service locations.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        $role = $workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    /**
     * Determine whether the user can update the service location.
     */
    public function update(User $user, ServiceLocation $location): bool
    {
        $role = $location->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    /**
     * Determine whether the user can delete the service location.
     */
    public function delete(User $user, ServiceLocation $location): bool
    {
        $role = $location->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }
}
