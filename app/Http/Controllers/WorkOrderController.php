<?php

namespace App\Http\Controllers;

use App\Enums\WorkOrderPriority;
use App\Enums\WorkOrderStatus;
use App\Events\WorkOrderAssigned;
use App\Http\Requests\StoreWorkOrderRequest;
use App\Http\Requests\UpdateWorkOrderRequest;
use App\Models\WorkOrder;
use App\Models\WorkOrderAssignment;
use App\Models\WorkOrderStatusEvent;
use App\Services\PlanLimitService;
use App\Services\WorkOrderNumberGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WorkOrderController extends Controller
{
    public function __construct(
        protected WorkOrderNumberGenerator $numberGenerator,
        protected PlanLimitService $planLimitService,
    ) {}

    /**
     * Display a listing of work orders.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;
        Gate::authorize('viewAny', [WorkOrder::class, $workspace]);

        $role = $workspace->getUserRole($user);
        $isWorker = ($role === 'member');

        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status');
        $priority = $request->input('priority');
        $workerId = $request->input('worker_id');
        $isOverdueFilter = $request->boolean('overdue');

        $baseQuery = $workspace->workOrders()
            ->with(['customer', 'serviceLocation', 'assignedWorker']);

        // Field workers only see their assigned work orders
        if ($isWorker) {
            $baseQuery->where('assigned_to_user_id', $user->id);
        } elseif ($workerId) {
            $baseQuery->where('assigned_to_user_id', $workerId);
        }

        if ($search !== '') {
            $baseQuery->where(function ($q) use ($search) {
                $q->where('order_number', 'LIKE', "%{$search}%")
                    ->orWhere('title', 'LIKE', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'LIKE', "%{$search}%")
                            ->orWhere('company_name', 'LIKE', "%{$search}%");
                    });
            });
        }

        if ($status && in_array($status, array_column(WorkOrderStatus::cases(), 'value'), true)) {
            $baseQuery->where('status', $status);
        }

        if ($priority && in_array($priority, array_column(WorkOrderPriority::cases(), 'value'), true)) {
            $baseQuery->where('priority', $priority);
        }

        if ($isOverdueFilter) {
            $baseQuery->overdue();
        }

        $workOrders = $baseQuery->latest()->paginate(15)->withQueryString();

        // Calculate workspace stats
        $statsQuery = $workspace->workOrders();
        if ($isWorker) {
            $statsQuery->where('assigned_to_user_id', $user->id);
        }

        $stats = [
            'total_active' => (clone $statsQuery)->whereNotIn('status', [WorkOrderStatus::Completed->value, WorkOrderStatus::Cancelled->value])->count(),
            'overdue' => (clone $statsQuery)->overdue()->count(),
            'pending_review' => (clone $statsQuery)->where('status', WorkOrderStatus::Submitted->value)->count(),
            'completed_today' => (clone $statsQuery)->where('status', WorkOrderStatus::Completed->value)
                ->whereDate('completed_at', now()->toDateString())
                ->count(),
        ];

        $workers = $workspace->users()
            ->select('users.id', 'users.name', 'users.email')
            ->get();

        return Inertia::render('work-orders/index', [
            'workOrders' => $workOrders,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'priority' => $priority,
                'worker_id' => $workerId,
                'overdue' => $isOverdueFilter,
            ],
            'stats' => $stats,
            'workers' => $workers,
            'canManage' => in_array($role, ['owner', 'admin'], true),
            'userRole' => $role,
        ]);
    }

    /**
     * Show the form for creating a new work order.
     */
    public function create(Request $request): Response
    {
        $workspace = $request->user()->currentWorkspace;
        Gate::authorize('create', [WorkOrder::class, $workspace]);

        $customers = $workspace->customers()
            ->with(['serviceLocations'])
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $workers = $workspace->users()
            ->select('users.id', 'users.name', 'users.email')
            ->get();

        return Inertia::render('work-orders/create', [
            'customers' => $customers,
            'workers' => $workers,
            'priorities' => array_column(WorkOrderPriority::cases(), 'value'),
        ]);
    }

    /**
     * Store a newly created work order.
     */
    public function store(StoreWorkOrderRequest $request): RedirectResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;
        Gate::authorize('create', [WorkOrder::class, $workspace]);

        $validated = $request->validated();

        if (! $this->planLimitService->canCreateWorkOrder($workspace)) {
            throw ValidationException::withMessages([
                'plan' => 'Monthly work order limit reached for your subscription plan. Please upgrade to continue creating jobs.',
            ]);
        }

        $workOrder = DB::transaction(function () use ($workspace, $user, $validated) {
            $orderNumber = $this->numberGenerator->generate($workspace);
            $assignedUserId = $validated['assigned_to_user_id'] ?? null;
            $initialStatus = $assignedUserId ? WorkOrderStatus::Assigned : WorkOrderStatus::Draft;

            $order = $workspace->workOrders()->create([
                ...$validated,
                'order_number' => $orderNumber,
                'status' => $initialStatus,
                'created_by_user_id' => $user->id,
            ]);

            // If initially assigned, create initial assignment record & status event
            if ($assignedUserId) {
                WorkOrderAssignment::create([
                    'workspace_id' => $workspace->id,
                    'work_order_id' => $order->id,
                    'user_id' => $assignedUserId,
                    'assigned_by_user_id' => $user->id,
                    'assigned_at' => now(),
                ]);

                WorkOrderStatusEvent::create([
                    'workspace_id' => $workspace->id,
                    'work_order_id' => $order->id,
                    'user_id' => $user->id,
                    'from_status' => WorkOrderStatus::Draft,
                    'to_status' => WorkOrderStatus::Assigned,
                    'comment' => 'Initial worker assignment.',
                ]);

                $worker = $workspace->users()->find($assignedUserId);
                if ($worker) {
                    event(new WorkOrderAssigned($order, $worker, $user));
                }
            }

            return $order;
        });

        return redirect()->route('work-orders.show', $workOrder)
            ->with('success', "Work order {$workOrder->order_number} created successfully.");
    }

    /**
     * Display the specified work order.
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
            'assignments.worker',
            'assignments.assignedBy',
            'statusEvents.user',
            'checklists.items.completedBy',
            'evidence.uploader',
        ]);

        $role = $workspace->getUserRole($user);
        $workers = $workspace->users()
            ->select('users.id', 'users.name', 'users.email')
            ->get();

        $availableTemplates = $workspace->checklistTemplates()
            ->where('is_active', true)
            ->select('id', 'name', 'description')
            ->get();

        return Inertia::render('work-orders/show', [
            'workOrder' => $workOrder,
            'workers' => $workers,
            'availableTemplates' => $availableTemplates,
            'canManage' => in_array($role, ['owner', 'admin'], true),
            'isAssignedWorker' => ($workOrder->assigned_to_user_id === $user->id),
            'userRole' => $role,
        ]);
    }

    /**
     * Show the form for editing the work order.
     */
    public function edit(Request $request, WorkOrder $workOrder): Response
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($workOrder->workspace_id === $workspace->id, 404);
        Gate::authorize('update', $workOrder);

        $workOrder->load(['customer.serviceLocations', 'serviceLocation']);

        $customers = $workspace->customers()
            ->with(['serviceLocations'])
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('work-orders/edit', [
            'workOrder' => $workOrder,
            'customers' => $customers,
            'priorities' => array_column(WorkOrderPriority::cases(), 'value'),
        ]);
    }

    /**
     * Update the specified work order details.
     */
    public function update(UpdateWorkOrderRequest $request, WorkOrder $workOrder): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($workOrder->workspace_id === $workspace->id, 404);
        Gate::authorize('update', $workOrder);

        $workOrder->update($request->validated());

        return redirect()->route('work-orders.show', $workOrder)
            ->with('success', 'Work order updated successfully.');
    }

    /**
     * Remove the specified work order.
     */
    public function destroy(Request $request, WorkOrder $workOrder): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($workOrder->workspace_id === $workspace->id, 404);
        Gate::authorize('delete', $workOrder);

        $workOrder->delete();

        return redirect()->route('work-orders.index')
            ->with('success', 'Work order deleted successfully.');
    }
}
