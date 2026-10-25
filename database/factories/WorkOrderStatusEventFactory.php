<?php

namespace Database\Factories;

use App\Enums\WorkOrderStatus;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderStatusEvent;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkOrderStatusEvent>
 */
class WorkOrderStatusEventFactory extends Factory
{
    protected $model = WorkOrderStatusEvent::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'work_order_id' => WorkOrder::factory(),
            'user_id' => User::factory(),
            'from_status' => WorkOrderStatus::Draft,
            'to_status' => WorkOrderStatus::Assigned,
            'comment' => fake()->sentence(),
        ];
    }
}
