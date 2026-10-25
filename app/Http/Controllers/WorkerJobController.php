<?php

namespace App\Http\Controllers;

use App\Enums\WorkOrderStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkerJobController extends Controller
{
    /**
     * Display a mobile-friendly view of jobs assigned to the current field worker.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;

        $tab = $request->input('tab', 'active'); // 'active', 'completed', 'all'

        $query = $workspace->workOrders()
            ->with(['customer', 'serviceLocation'])
            ->where('assigned_to_user_id', $user->id);

        if ($tab === 'completed') {
            $query->where('status', WorkOrderStatus::Completed->value);
        } elseif ($tab === 'active') {
            $query->whereIn('status', [
                WorkOrderStatus::Assigned->value,
                WorkOrderStatus::InProgress->value,
                WorkOrderStatus::ChangesRequested->value,
                WorkOrderStatus::Submitted->value,
            ]);
        }

        $jobs = $query->orderByRaw("
            CASE status
                WHEN '".WorkOrderStatus::ChangesRequested->value."' THEN 1
                WHEN '".WorkOrderStatus::InProgress->value."' THEN 2
                WHEN '".WorkOrderStatus::Assigned->value."' THEN 3
                WHEN '".WorkOrderStatus::Submitted->value."' THEN 4
                ELSE 5
            END ASC
        ")->latest('due_date')->paginate(20)->withQueryString();

        $counts = [
            'active' => $workspace->workOrders()
                ->where('assigned_to_user_id', $user->id)
                ->whereIn('status', [
                    WorkOrderStatus::Assigned->value,
                    WorkOrderStatus::InProgress->value,
                    WorkOrderStatus::ChangesRequested->value,
                    WorkOrderStatus::Submitted->value,
                ])->count(),
            'completed' => $workspace->workOrders()
                ->where('assigned_to_user_id', $user->id)
                ->where('status', WorkOrderStatus::Completed->value)
                ->count(),
        ];

        return Inertia::render('worker/my-jobs', [
            'jobs' => $jobs,
            'currentTab' => $tab,
            'counts' => $counts,
        ]);
    }
}
