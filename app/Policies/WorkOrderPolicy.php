<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkOrder;
use App\Models\Workspace;

class WorkOrderPolicy
{
    /**
     * Determine whether the user can view any work orders.
     */
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $workspace->hasUser($user);
    }

    /**
     * Determine whether the user can view a specific work order.
     */
    public function view(User $user, WorkOrder $workOrder): bool
    {
        $workspace = $workOrder->workspace;

        if (! $workspace->hasUser($user)) {
            return false;
        }

        $role = $workspace->getUserRole($user);

        // Admins, owners, and viewers can see all work orders in the workspace
        if (in_array($role, ['owner', 'admin', 'viewer'], true)) {
            return true;
        }

        // Field workers (members) can ONLY view work orders assigned to them
        return $workOrder->assigned_to_user_id === $user->id;
    }

    /**
     * Determine whether the user can create work orders.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        $role = $workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    /**
     * Determine whether the user can update the work order details.
     */
    public function update(User $user, WorkOrder $workOrder): bool
    {
        $role = $workOrder->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    /**
     * Determine whether the user can assign or reassign workers.
     */
    public function assign(User $user, WorkOrder $workOrder): bool
    {
        $role = $workOrder->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    /**
     * Determine whether the user can delete the work order.
     */
    public function delete(User $user, WorkOrder $workOrder): bool
    {
        $role = $workOrder->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }
}
