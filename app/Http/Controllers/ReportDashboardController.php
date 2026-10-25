<?php

namespace App\Http\Controllers;

use App\Enums\WorkOrderStatus;
use App\Models\WorkOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportDashboardController extends Controller
{
    /**
     * Display reporting and analytics dashboard.
     */
    public function index(Request $request): Response
    {
        $workspace = $request->user()->currentWorkspace;
        Gate::authorize('viewAny', [WorkOrder::class, $workspace]);

        $totalJobs = $workspace->workOrders()->count();
        $completedJobs = $workspace->workOrders()->where('status', WorkOrderStatus::Completed->value)->count();
        $inProgressJobs = $workspace->workOrders()->where('status', WorkOrderStatus::InProgress->value)->count();
        $submittedJobs = $workspace->workOrders()->where('status', WorkOrderStatus::Submitted->value)->count();
        $overdueJobs = $workspace->workOrders()->overdue()->count();

        // On-time completion calculation
        $completedWithDue = $workspace->workOrders()
            ->where('status', WorkOrderStatus::Completed->value)
            ->whereNotNull('due_date')
            ->get();

        $completedOnTimeCount = $completedWithDue->filter(function ($order) {
            $completionEvent = $order->statusEvents()
                ->where('to_status', WorkOrderStatus::Completed->value)
                ->latest()
                ->first();

            if (! $completionEvent) {
                return true;
            }

            return $completionEvent->created_at->lte($order->due_date->endOfDay());
        })->count();

        $onTimeRate = $completedWithDue->count() > 0
            ? round(($completedOnTimeCount / $completedWithDue->count()) * 100, 1)
            : 100.0;

        // Worker workload breakdown
        $workers = $workspace->users()
            ->select('users.id', 'users.name', 'users.email')
            ->get()
            ->map(function ($worker) use ($workspace) {
                $activeCount = $workspace->workOrders()
                    ->where('assigned_to_user_id', $worker->id)
                    ->whereIn('status', [WorkOrderStatus::Assigned->value, WorkOrderStatus::InProgress->value, WorkOrderStatus::Submitted->value])
                    ->count();

                $completedCount = $workspace->workOrders()
                    ->where('assigned_to_user_id', $worker->id)
                    ->where('status', WorkOrderStatus::Completed->value)
                    ->count();

                return [
                    'id' => $worker->id,
                    'name' => $worker->name,
                    'email' => $worker->email,
                    'active_jobs' => $activeCount,
                    'completed_jobs' => $completedCount,
                ];
            });

        // Top customer service breakdown
        $topCustomers = $workspace->customers()
            ->withCount(['workOrders'])
            ->orderByDesc('work_orders_count')
            ->take(8)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'company_name' => $customer->company_name,
                    'total_jobs' => $customer->work_orders_count,
                ];
            });

        return Inertia::render('reports/index', [
            'metrics' => [
                'total_jobs' => $totalJobs,
                'completed_jobs' => $completedJobs,
                'in_progress_jobs' => $inProgressJobs,
                'submitted_jobs' => $submittedJobs,
                'overdue_jobs' => $overdueJobs,
                'on_time_rate' => $onTimeRate,
            ],
            'workers' => $workers,
            'topCustomers' => $topCustomers,
        ]);
    }

    /**
     * Export workspace work orders to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $workspace = $request->user()->currentWorkspace;
        Gate::authorize('viewAny', [WorkOrder::class, $workspace]);

        $fileName = 'crewflow-work-orders-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($workspace) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            // CSV Header Row
            fputcsv($handle, [
                'Order Number',
                'Title',
                'Status',
                'Priority',
                'Customer Name',
                'Customer Company',
                'Service Location',
                'Assigned Worker',
                'Due Date',
                'Created At',
            ]);

            // Query work orders in chunks for memory efficiency
            $workspace->workOrders()
                ->with(['customer', 'serviceLocation', 'assignedWorker'])
                ->orderByDesc('created_at')
                ->chunk(200, function ($orders) use ($handle) {
                    foreach ($orders as $order) {
                        fputcsv($handle, [
                            $order->order_number,
                            $order->title,
                            $order->status->label(),
                            $order->priority->label(),
                            $order->customer?->name ?? 'N/A',
                            $order->customer?->company_name ?? '',
                            $order->serviceLocation?->name ?? 'N/A',
                            $order->assignedWorker?->name ?? 'Unassigned',
                            $order->due_date ? $order->due_date->format('Y-m-d') : 'No Due Date',
                            $order->created_at->format('Y-m-d H:i:s'),
                        ]);
                    }
                });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }
}
