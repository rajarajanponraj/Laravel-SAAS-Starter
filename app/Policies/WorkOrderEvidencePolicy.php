<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderEvidence;

class WorkOrderEvidencePolicy
{
    public function view(User $user, WorkOrderEvidence $evidence): bool
    {
        $workspace = $evidence->workspace;
        if (! $workspace->hasUser($user)) {
            return false;
        }

        $role = $workspace->getUserRole($user);
        if (in_array($role, ['owner', 'admin', 'viewer'], true)) {
            return true;
        }

        // Field worker can view if assigned to the work order
        return $evidence->workOrder->assigned_to_user_id === $user->id;
    }

    public function create(User $user, WorkOrder $workOrder): bool
    {
        $workspace = $workOrder->workspace;
        if (! $workspace->hasUser($user)) {
            return false;
        }

        $role = $workspace->getUserRole($user);
        if (in_array($role, ['owner', 'admin'], true)) {
            return true;
        }

        // Assigned worker can upload evidence
        return $workOrder->assigned_to_user_id === $user->id;
    }

    public function delete(User $user, WorkOrderEvidence $evidence): bool
    {
        $workspace = $evidence->workspace;
        if (! $workspace->hasUser($user)) {
            return false;
        }

        $role = $workspace->getUserRole($user);
        if (in_array($role, ['owner', 'admin'], true)) {
            return true;
        }

        return $evidence->uploaded_by_user_id === $user->id;
    }
}
