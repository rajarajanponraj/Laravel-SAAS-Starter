<?php

namespace Database\Factories;

use App\Models\ChecklistTemplate;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChecklistTemplate>
 */
class ChecklistTemplateFactory extends Factory
{
    protected $model = ChecklistTemplate::class;

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
                'Standard HVAC Inspection',
                'Plumbing Diagnostic Checklist',
                'Electrical Safety Audit',
                'Facilities Cleaning & Turnover',
                'Preventative Maintenance Protocol',
            ]),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
