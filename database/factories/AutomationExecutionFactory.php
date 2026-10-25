<?php

namespace Database\Factories;

use App\Models\AutomationExecution;
use App\Models\AutomationRule;
use App\Models\WorkOrder;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AutomationExecution>
 */
class AutomationExecutionFactory extends Factory
{
    protected $model = AutomationExecution::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'automation_rule_id' => AutomationRule::factory(),
            'work_order_id' => WorkOrder::factory(),
            'idempotency_key' => 'exec_'.Str::uuid(),
            'status' => 'success',
            'error_message' => null,
            'executed_at' => now(),
        ];
    }
}
