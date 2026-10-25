<?php

namespace App\Services;

use App\Enums\WorkOrderStatus;
use App\Events\WorkOrderStatusChanged;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderStatusEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkOrderStateMachine
{
    public function __construct(
        protected ChecklistValidationService $checklistValidator
    ) {}

    /**
     * Transition a work order to a new status.
     *
     * @throws ValidationException
     */
    public function transition(WorkOrder $workOrder, WorkOrderStatus $targetStatus, User $actor, ?string $comment = null): WorkOrder
    {
        $currentStatus = $workOrder->status;

        // 1. Validate basic state machine graph
        if (! $currentStatus->canTransitionTo($targetStatus)) {
            throw ValidationException::withMessages([
                'status' => "Cannot transition work order from {$currentStatus->label()} to {$targetStatus->label()}.",
            ]);
        }

        // 2. Validate actor permissions for this specific transition
        $this->authorizeTransition($workOrder, $currentStatus, $targetStatus, $actor, $comment);

        // 3. If submitting for review, validate that all required checklist items are completed
        if ($targetStatus === WorkOrderStatus::Submitted) {
            $this->checklistValidator->validateForSubmission($workOrder);
        }

        // 4. Perform atomic transition
        return DB::transaction(function () use ($workOrder, $currentStatus, $targetStatus, $actor, $comment) {
            $workOrder->status = $targetStatus;

            if ($targetStatus === WorkOrderStatus::Completed) {
                $workOrder->completed_at = now();
            }

            $workOrder->save();

            WorkOrderStatusEvent::create([
                'workspace_id' => $workOrder->workspace_id,
                'work_order_id' => $workOrder->id,
                'user_id' => $actor->id,
                'from_status' => $currentStatus,
                'to_status' => $targetStatus,
                'comment' => $comment,
            ]);

            event(new WorkOrderStatusChanged(
                workOrder: $workOrder,
                fromStatus: $currentStatus,
                toStatus: $targetStatus,
                actor: $actor,
                comment: $comment,
            ));

            return $workOrder->fresh(['customer', 'serviceLocation', 'assignedWorker', 'statusEvents']);
        });
    }

    /**
     * Authorize whether the actor is allowed to execute this transition.
     *
     * @throws ValidationException
     */
    protected function authorizeTransition(
        WorkOrder $workOrder,
        WorkOrderStatus $from,
        WorkOrderStatus $to,
        User $actor,
        ?string $comment = null
    ): void {
        $workspace = $workOrder->workspace;
        $role = $workspace->getUserRole($actor);

        if (! $role || $role === 'viewer') {
            throw ValidationException::withMessages([
                'status' => 'Viewers are not permitted to update work order status.',
            ]);
        }

        $isAdminOrOwner = in_array($role, ['owner', 'admin'], true);
        $isAssignedWorker = $workOrder->assigned_to_user_id === $actor->id;

        // Only Admin or Owner can approve or request changes
        if (in_array($to, [WorkOrderStatus::Completed, WorkOrderStatus::ChangesRequested], true)) {
            if (! $isAdminOrOwner) {
                throw ValidationException::withMessages([
                    'status' => 'Only workspace managers can review or approve work orders.',
                ]);
            }

            if ($to === WorkOrderStatus::ChangesRequested && empty(trim((string) $comment))) {
                throw ValidationException::withMessages([
                    'comment' => 'A reason or comment is required when requesting changes.',
                ]);
            }

            return;
        }

        // Only Admin, Owner, or the Assigned Worker can start or submit work
        if (in_array($to, [WorkOrderStatus::InProgress, WorkOrderStatus::Submitted], true)) {
            if (! $isAdminOrOwner && ! $isAssignedWorker) {
                throw ValidationException::withMessages([
                    'status' => 'You are not assigned to this work order.',
                ]);
            }

            return;
        }

        // Admin or Owner required for draft or cancel transitions
        if (in_array($to, [WorkOrderStatus::Draft, WorkOrderStatus::Cancelled], true)) {
            if (! $isAdminOrOwner) {
                throw ValidationException::withMessages([
                    'status' => 'Only workspace managers can cancel or reset work orders.',
                ]);
            }

            return;
        }

        // Transitioning to Assigned requires Admin or Owner
        if ($to === WorkOrderStatus::Assigned) {
            if (! $isAdminOrOwner) {
                throw ValidationException::withMessages([
                    'status' => 'Only workspace managers can assign work orders.',
                ]);
            }
        }
    }
}
