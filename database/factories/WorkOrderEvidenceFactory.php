<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderEvidence;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<WorkOrderEvidence>
 */
class WorkOrderEvidenceFactory extends Factory
{
    protected $model = WorkOrderEvidence::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $uuid = Str::uuid();

        return [
            'workspace_id' => Workspace::factory(),
            'work_order_id' => WorkOrder::factory(),
            'uploaded_by_user_id' => User::factory(),
            'original_filename' => 'site-photo.jpg',
            'storage_path' => "workspaces/1/work-orders/1/evidence/{$uuid}.jpg",
            'disk' => 'local',
            'mime_type' => 'image/jpeg',
            'file_size' => 1024 * 512, // 512 KB
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
