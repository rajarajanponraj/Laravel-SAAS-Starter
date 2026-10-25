<?php

namespace Database\Factories;

use App\Models\ChecklistTemplate;
use App\Models\WorkOrder;
use App\Models\WorkOrderChecklist;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkOrderChecklist>
 */
class WorkOrderChecklistFactory extends Factory
{
    protected $model = WorkOrderChecklist::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'work_order_id' => WorkOrder::factory(),
            'checklist_template_id' => ChecklistTemplate::factory(),
            'name' => fake()->words(3, true),
        ];
    }
}
