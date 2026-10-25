<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WorkOrderReportController extends Controller
{
    /**
     * Display the job completion report for a work order.
     */
    public function show(Request $request, WorkOrder $workOrder): Response
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;
        abort_unless($workOrder->workspace_id === $workspace->id, 404);
        Gate::authorize('view', $workOrder);

        $workOrder->load([
            'customer',
            'serviceLocation',
            'assignedWorker',
            'createdBy',
            'checklists.items.completedBy',
            'evidence.uploader',
            'statusEvents.user',
        ]);

        return Inertia::render('work-orders/report', [
            'workOrder' => $workOrder,
            'workspace' => [
                'name' => $workspace->name,
                'email' => $workspace->owner?->email,
            ],
        ]);
    }
}
