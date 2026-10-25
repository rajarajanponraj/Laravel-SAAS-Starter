<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAutomationRuleRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:255'],
            'trigger_event' => ['required', 'string', 'in:work_order.assigned,work_order.submitted,work_order.approved,work_order.changes_requested,work_order.overdue'],
            'conditions' => ['nullable', 'array'],
            'action_type' => ['required', 'string', 'in:send_notification,create_follow_up'],
            'action_config' => ['required', 'array'],
            'action_config.subject' => ['nullable', 'string', 'max:255'],
            'action_config.recipient' => ['nullable', 'string', 'in:manager,worker,customer'],
            'action_config.message' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
