<?php

namespace App\Http\Controllers;

use App\Enums\WorkOrderStatus;
use App\Http\Requests\TransitionWorkOrderStatusRequest;
use App\Models\WorkOrder;
use App\Services\WorkOrderStateMachine;
use Illuminate\Http\RedirectResponse;

class WorkOrderStatusController extends Controller
{
    public function __construct(
        protected WorkOrderStateMachine $stateMachine
    ) {}

    /**
     * Transition the status of a work order.
     */
    public function update(TransitionWorkOrderStatusRequest $request, WorkOrder $workOrder): RedirectResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;
        abort_unless($workOrder->workspace_id === $workspace->id, 404);

        $targetStatus = WorkOrderStatus::from($request->validated('status'));
        $comment = $request->validated('comment');

        $this->stateMachine->transition(
            workOrder: $workOrder,
            targetStatus: $targetStatus,
            actor: $user,
            comment: $comment,
        );

        return back()->with('success', "Work order status updated to {$targetStatus->label()}.");
    }
}
