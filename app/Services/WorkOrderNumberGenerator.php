<?php

namespace App\Services;

use App\Models\WorkOrder;
use App\Models\Workspace;

class WorkOrderNumberGenerator
{
    /**
     * Generate the next sequential order number for a workspace.
     */
    public function generate(Workspace $workspace): string
    {
        $lastOrder = WorkOrder::withTrashed()
            ->where('workspace_id', $workspace->id)
            ->where('order_number', 'LIKE', 'WO-%')
            ->orderByRaw('CAST(SUBSTRING(order_number, 4) AS UNSIGNED) DESC')
            ->first();

        $nextNumber = 1;

        if ($lastOrder && preg_match('/^WO-(\d+)$/', $lastOrder->order_number, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        }

        return sprintf('WO-%04d', $nextNumber);
    }
}
