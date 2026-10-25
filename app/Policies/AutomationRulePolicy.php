<?php

namespace App\Policies;

use App\Models\AutomationRule;
use App\Models\User;
use App\Models\Workspace;

class AutomationRulePolicy
{
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $workspace->hasUser($user);
    }

    public function view(User $user, AutomationRule $rule): bool
    {
        return $rule->workspace->hasUser($user);
    }

    public function create(User $user, Workspace $workspace): bool
    {
        $role = $workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    public function update(User $user, AutomationRule $rule): bool
    {
        $role = $rule->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    public function delete(User $user, AutomationRule $rule): bool
    {
        $role = $rule->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }
}
