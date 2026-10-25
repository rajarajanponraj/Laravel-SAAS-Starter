<?php

namespace App\Policies;

use App\Models\ChecklistTemplate;
use App\Models\User;
use App\Models\Workspace;

class ChecklistTemplatePolicy
{
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $workspace->hasUser($user);
    }

    public function view(User $user, ChecklistTemplate $template): bool
    {
        return $template->workspace->hasUser($user);
    }

    public function create(User $user, Workspace $workspace): bool
    {
        $role = $workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    public function update(User $user, ChecklistTemplate $template): bool
    {
        $role = $template->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    public function delete(User $user, ChecklistTemplate $template): bool
    {
        $role = $template->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }
}
