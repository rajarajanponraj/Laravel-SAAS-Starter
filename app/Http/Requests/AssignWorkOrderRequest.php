<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignWorkOrderRequest extends FormRequest
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
            'user_id' => [
                'required',
                'integer',
                Rule::exists('workspace_user', 'user_id')->where('workspace_id', $workspaceId),
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
