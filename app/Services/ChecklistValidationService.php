<?php

namespace App\Services;

use App\Models\WorkOrder;
use Illuminate\Validation\ValidationException;

class ChecklistValidationService
{
    /**
     * Validate that all required checklist items on the work order are completed.
     *
     * @throws ValidationException
     */
    public function validateForSubmission(WorkOrder $workOrder): void
    {
        $checklists = $workOrder->checklists()->with('items')->get();

        foreach ($checklists as $checklist) {
            foreach ($checklist->items as $item) {
                if (! $item->is_required) {
                    continue;
                }

                if (! $item->is_completed) {
                    throw ValidationException::withMessages([
                        'checklist' => "Cannot submit work order for review: Required checklist item \"{$item->label}\" has not been completed.",
                    ]);
                }

                if ($item->type === 'text' && empty(trim((string) $item->text_response))) {
                    throw ValidationException::withMessages([
                        'checklist' => "Cannot submit work order for review: Required checklist item \"{$item->label}\" requires a text note or response.",
                    ]);
                }
            }
        }
    }
}
