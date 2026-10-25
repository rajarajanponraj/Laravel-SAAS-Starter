<?php

namespace App\Http\Requests;

use App\Enums\WorkOrderPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        $workspaceId = $this->user()?->currentWorkspace?->id;

        return [
            'customer_id' => [
                'required',
                'integer',
                Rule::exists('customers', 'id')->where('workspace_id', $workspaceId),
            ],
            'service_location_id' => [
                'nullable',
                'integer',
                Rule::exists('service_locations', 'id')->where('workspace_id', $workspaceId),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'priority' => ['required', Rule::enum(WorkOrderPriority::class)],
            'due_date' => ['nullable', 'date'],
            'scheduled_start_at' => ['nullable', 'date'],
            'scheduled_end_at' => ['nullable', 'date', 'after_or_equal:scheduled_start_at'],
            'assigned_to_user_id' => [
                'nullable',
                'integer',
                Rule::exists('workspace_user', 'user_id')->where('workspace_id', $workspaceId),
            ],
        ];
    }
}
