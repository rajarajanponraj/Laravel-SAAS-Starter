<?php

namespace Database\Factories;

use App\Enums\CustomerStatus;
use App\Models\Customer;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'company_name' => fake()->company(),
            'notes' => fake()->sentence(),
            'status' => CustomerStatus::Active,
        ];
    }

    /**
     * Indicate customer is archived.
     */
    public function archived(): static
    {
        return $this->state(fn () => [
            'status' => CustomerStatus::Archived,
        ]);
    }
}
