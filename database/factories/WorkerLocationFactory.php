<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WorkerLocation;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkerLocation>
 */
class WorkerLocationFactory extends Factory
{
    protected $model = WorkerLocation::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'user_id' => User::factory(),
            'work_order_id' => null,
            'latitude' => fake()->latitude(37.70, 37.82), // Default SF Bay Area
            'longitude' => fake()->longitude(-122.52, -122.37),
            'accuracy' => fake()->randomFloat(1, 3, 20),
            'heading' => fake()->randomFloat(1, 0, 360),
            'speed' => fake()->randomFloat(1, 0, 25),
            'battery_level' => fake()->numberBetween(15, 100),
            'activity_type' => fake()->randomElement(['on_shift', 'en_route', 'on_site', 'idle']),
            'captured_at' => now(),
        ];
    }
}
