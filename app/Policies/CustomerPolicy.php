<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;
use App\Models\Workspace;

class CustomerPolicy
{
    /**
     * Determine whether the user can view any customers.
     */
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $workspace->hasUser($user);
    }

    /**
     * Determine whether the user can view the customer.
     */
    public function view(User $user, Customer $customer): bool
    {
        return $customer->workspace->hasUser($user);
    }

    /**
     * Determine whether the user can create customers.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        $role = $workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    /**
     * Determine whether the user can update the customer.
     */
    public function update(User $user, Customer $customer): bool
    {
        $role = $customer->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }

    /**
     * Determine whether the user can delete/archive the customer.
     */
    public function delete(User $user, Customer $customer): bool
    {
        $role = $customer->workspace->getUserRole($user);

        return in_array($role, ['owner', 'admin'], true);
    }
}
