<?php

namespace Database\Factories;

use App\Models\NotificationDelivery;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NotificationDelivery>
 */
class NotificationDeliveryFactory extends Factory
{
    protected $model = NotificationDelivery::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'user_id' => User::factory(),
            'channel' => 'email',
            'type' => 'work_order_assigned',
            'subject' => fake()->sentence(),
            'recipient_email' => fake()->safeEmail(),
            'status' => 'sent',
            'error_message' => null,
            'sent_at' => now(),
        ];
    }
}
