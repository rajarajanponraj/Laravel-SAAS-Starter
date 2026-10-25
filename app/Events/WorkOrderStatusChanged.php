<?php

namespace App\Events;

use App\Enums\WorkOrderStatus;
use App\Models\User;
use App\Models\WorkOrder;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkOrderStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public WorkOrder $workOrder,
        public WorkOrderStatus $fromStatus,
        public WorkOrderStatus $toStatus,
        public ?User $actor = null,
        public ?string $comment = null,
    ) {}
}
