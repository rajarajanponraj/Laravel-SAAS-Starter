<?php

namespace App\Listeners;

use App\Enums\WorkOrderStatus;
use App\Events\WorkOrderAssigned;
use App\Events\WorkOrderStatusChanged;
use App\Services\AutomationEngine;

class DispatchWorkOrderAutomations
{
    public function __construct(
        protected AutomationEngine $engine
    ) {}

    /**
     * Handle work order status changed events.
     */
    public function handleStatusChanged(WorkOrderStatusChanged $event): void
    {
        $workOrder = $event->workOrder;

        if ($event->toStatus === WorkOrderStatus::Submitted) {
            $this->engine->trigger('work_order.submitted', $workOrder);
        } elseif ($event->toStatus === WorkOrderStatus::ChangesRequested) {
            $this->engine->trigger('work_order.changes_requested', $workOrder);
        } elseif ($event->toStatus === WorkOrderStatus::Completed) {
            $this->engine->trigger('work_order.approved', $workOrder);
        }
    }

    /**
     * Handle work order assigned events.
     */
    public function handleAssigned(WorkOrderAssigned $event): void
    {
        $this->engine->trigger('work_order.assigned', $event->workOrder);
    }
}
