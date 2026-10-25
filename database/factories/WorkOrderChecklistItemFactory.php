<?php

namespace Database\Factories;

use App\Models\WorkOrderChecklist;
use App\Models\WorkOrderChecklistItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkOrderChecklistItem>
 */
class WorkOrderChecklistItemFactory extends Factory
{
    protected $model = WorkOrderChecklistItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'work_order_checklist_id' => WorkOrderChecklist::factory(),
            'label' => fake()->sentence(4),
            'type' => 'checkbox',
            'is_required' => false,
            'is_completed' => false,
            'completed_at' => null,
            'completed_by_user_id' => null,
            'text_response' => null,
            'sort_order' => 0,
        ];
    }
}
