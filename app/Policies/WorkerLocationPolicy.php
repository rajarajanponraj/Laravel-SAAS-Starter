<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;

class WorkerLocationPolicy
{
    /**
     * Determine whether the user can view the dispatch map and worker locations.
     */
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $workspace->hasUser($user);
    }

    /**
     * Determine whether the user can view location history for a specific worker.
     */
    public function viewHistory(User $user, Workspace $workspace, User $targetUser): bool
    {
        if (! $workspace->hasUser($targetUser)) {
            return false;
        }

        if ($user->id === $targetUser->id) {
            return true;
        }

        $role = $workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    /**
     * Determine whether the user can record their location in this workspace.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        return $workspace->hasUser($user);
    }
}
