<?php

namespace Database\Factories;

use App\Enums\WorkOrderPriority;
use App\Enums\WorkOrderStatus;
use App\Models\Customer;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkOrder>
 */
class WorkOrderFactory extends Factory
{
    protected $model = WorkOrder::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'customer_id' => Customer::factory(),
            'service_location_id' => null,
            'order_number' => 'WO-'.fake()->unique()->numerify('####'),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'priority' => fake()->randomElement(WorkOrderPriority::cases()),
            'status' => WorkOrderStatus::Draft,
            'due_date' => fake()->dateTimeBetween('+1 day', '+2 weeks')->format('Y-m-d'),
            'scheduled_start_at' => null,
            'scheduled_end_at' => null,
            'created_by_user_id' => User::factory(),
            'assigned_to_user_id' => null,
            'completed_at' => null,
        ];
    }

    /**
     * Set status to assigned with assigned worker.
     */
    public function assigned(?User $worker = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => WorkOrderStatus::Assigned,
            'assigned_to_user_id' => $worker?->id ?? User::factory(),
        ]);
    }

    /**
     * Set status to in progress.
     */
    public function inProgress(?User $worker = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => WorkOrderStatus::InProgress,
            'assigned_to_user_id' => $worker?->id ?? User::factory(),
        ]);
    }

    /**
     * Set status to submitted.
     */
    public function submitted(?User $worker = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => WorkOrderStatus::Submitted,
            'assigned_to_user_id' => $worker?->id ?? User::factory(),
        ]);
    }

    /**
     * Set status to completed.
     */
    public function completed(?User $worker = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => WorkOrderStatus::Completed,
            'assigned_to_user_id' => $worker?->id ?? User::factory(),
            'completed_at' => now(),
        ]);
    }
}
