<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderAssignment;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkOrderAssignment>
 */
class WorkOrderAssignmentFactory extends Factory
{
    protected $model = WorkOrderAssignment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'work_order_id' => WorkOrder::factory(),
            'user_id' => User::factory(),
            'assigned_by_user_id' => User::factory(),
            'assigned_at' => now(),
            'notes' => fake()->sentence(),
        ];
    }
}
