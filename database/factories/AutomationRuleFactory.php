<?php

namespace Database\Factories;

use App\Models\AutomationRule;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AutomationRule>
 */
class AutomationRuleFactory extends Factory
{
    protected $model = AutomationRule::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => fake()->randomElement([
                'Notify Manager on Overdue Work Order',
                'Alert Technician on New Job Assignment',
                'Follow-up Inspection on Completed Job',
                'Supervisor Notification on Submitted Work',
            ]),
            'trigger_event' => fake()->randomElement([
                'work_order.assigned',
                'work_order.submitted',
                'work_order.approved',
                'work_order.changes_requested',
                'work_order.overdue',
            ]),
            'conditions' => null,
            'action_type' => 'send_notification',
            'action_config' => [
                'subject' => 'Work Order Notification Alert',
                'recipient' => 'manager',
                'message' => 'Automated event notification.',
            ],
            'is_active' => true,
        ];
    }
}
