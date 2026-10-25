<?php

namespace App\Http\Controllers;

use App\Enums\WorkOrderStatus;
use App\Events\WorkOrderAssigned;
use App\Http\Requests\AssignWorkOrderRequest;
use App\Models\WorkOrder;
use App\Models\WorkOrderAssignment;
use App\Models\WorkOrderStatusEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class WorkOrderAssignmentController extends Controller
{
    /**
     * Assign or reassign a field worker to a work order.
     */
    public function store(AssignWorkOrderRequest $request, WorkOrder $workOrder): RedirectResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;
        abort_unless($workOrder->workspace_id === $workspace->id, 404);
        Gate::authorize('assign', $workOrder);

        $newUserId = (int) $request->validated('user_id');
        $notes = $request->validated('notes');

        DB::transaction(function () use ($workOrder, $workspace, $user, $newUserId, $notes) {
            $previousUserId = $workOrder->assigned_to_user_id;

            $workOrder->assigned_to_user_id = $newUserId;

            // If work order was draft, transition to assigned
            if ($workOrder->status === WorkOrderStatus::Draft) {
                $workOrder->status = WorkOrderStatus::Assigned;

                WorkOrderStatusEvent::create([
                    'workspace_id' => $workspace->id,
                    'work_order_id' => $workOrder->id,
                    'user_id' => $user->id,
                    'from_status' => WorkOrderStatus::Draft,
                    'to_status' => WorkOrderStatus::Assigned,
                    'comment' => $notes ?: 'Assigned to worker.',
                ]);
            }

            $workOrder->save();

            WorkOrderAssignment::create([
                'workspace_id' => $workspace->id,
                'work_order_id' => $workOrder->id,
                'user_id' => $newUserId,
                'assigned_by_user_id' => $user->id,
                'assigned_at' => now(),
                'notes' => $notes,
            ]);

            $worker = $workspace->users()->find($newUserId);
            if ($worker) {
                event(new WorkOrderAssigned($workOrder, $worker, $user, $notes));
            }
        });

        return back()->with('success', 'Worker assigned successfully.');
    }
}
