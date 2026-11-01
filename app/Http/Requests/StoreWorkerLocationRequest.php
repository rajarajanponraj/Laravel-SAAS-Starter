<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkerLocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $workspace = $this->attributes->get('workspace') ?? $this->user()?->currentWorkspace;

        return $workspace && $this->user()?->belongsToWorkspace($workspace);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        $workspace = $this->attributes->get('workspace') ?? $this->user()?->currentWorkspace;
        $workspaceId = $workspace?->id;

        return [
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'heading' => ['nullable', 'numeric', 'between:0,360'],
            'speed' => ['nullable', 'numeric', 'min:0'],
            'battery_level' => ['nullable', 'integer', 'between:0,100'],
            'activity_type' => ['nullable', 'string', 'in:on_shift,en_route,on_site,idle,completed_job'],
            'work_order_id' => [
                'nullable',
                'integer',
                Rule::exists('work_orders', 'id')->where('workspace_id', $workspaceId),
            ],
        ];
    }
}
