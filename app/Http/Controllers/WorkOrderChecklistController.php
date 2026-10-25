<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttachChecklistRequest;
use App\Http\Requests\UpdateChecklistItemRequest;
use App\Models\WorkOrder;
use App\Models\WorkOrderChecklistItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class WorkOrderChecklistController extends Controller
{
    /**
     * Attach a checklist template to a work order.
     */
    public function store(AttachChecklistRequest $request, WorkOrder $workOrder): RedirectResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;
        abort_unless($workOrder->workspace_id === $workspace->id, 404);
        Gate::authorize('update', $workOrder);

        $templateId = $request->validated('checklist_template_id');
        $template = $workspace->checklistTemplates()->with('items')->findOrFail($templateId);

        DB::transaction(function () use ($workspace, $workOrder, $template) {
            $checklist = $workOrder->checklists()->create([
                'workspace_id' => $workspace->id,
                'checklist_template_id' => $template->id,
                'name' => $template->name,
            ]);

            foreach ($template->items as $item) {
                $checklist->items()->create([
                    'label' => $item->label,
                    'type' => $item->type,
                    'is_required' => $item->is_required,
                    'is_completed' => false,
                    'sort_order' => $item->sort_order,
                ]);
            }
        });

        return back()->with('success', "Checklist \"{$template->name}\" added to work order.");
    }

    /**
     * Toggle or update a checklist item.
     */
    public function updateItem(
        UpdateChecklistItemRequest $request,
        WorkOrder $workOrder,
        WorkOrderChecklistItem $checklistItem
    ): RedirectResponse {
        $user = $request->user();
        $workspace = $user->currentWorkspace;
        abort_unless($workOrder->workspace_id === $workspace->id, 404);

        // Verify checklist item belongs to this work order
        abort_unless($checklistItem->checklist->work_order_id === $workOrder->id, 404);

        // Ensure user is authorized to perform work on this job
        $role = $workspace->getUserRole($user);
        $isAuthorized = in_array($role, ['owner', 'admin'], true) || ($workOrder->assigned_to_user_id === $user->id);
        abort_unless($isAuthorized, 403, 'Unauthorized to modify checklist items for this work order.');

        $data = $request->validated();

        if (array_key_exists('is_completed', $data)) {
            $checklistItem->is_completed = (bool) $data['is_completed'];
            $checklistItem->completed_at = $checklistItem->is_completed ? now() : null;
            $checklistItem->completed_by_user_id = $checklistItem->is_completed ? $user->id : null;
        }

        if (array_key_exists('text_response', $data)) {
            $checklistItem->text_response = $data['text_response'];
            // If text response is provided and item is a text type, consider it completed
            if ($checklistItem->type === 'text' && ! empty(trim((string) $data['text_response']))) {
                $checklistItem->is_completed = true;
                $checklistItem->completed_at = now();
                $checklistItem->completed_by_user_id = $user->id;
            }
        }

        $checklistItem->save();

        return back()->with('success', 'Checklist item updated.');
    }
}
