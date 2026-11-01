<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkerLocationRequest;
use App\Models\User;
use App\Models\WorkerLocation;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkerLocationController extends Controller
{
    /**
     * Display the workspace live dispatch map and worker tracking.
     */
    public function index(Request $request): Response
    {
        $workspace = $this->resolveWorkspace($request);

        if (! $request->user()->can('viewAny', [WorkerLocation::class, $workspace])) {
            abort(403, 'Unauthorized to access workspace dispatch map.');
        }

        $members = $workspace->users()
            ->get(['users.id', 'users.name', 'users.email', 'users.avatar_url']);

        $latestLocations = WorkerLocation::query()
            ->where('workspace_id', $workspace->id)
            ->with(['user:id,name,email,avatar_url', 'workOrder:id,order_number,title,status'])
            ->whereIn('id', function ($sub) use ($workspace) {
                $sub->selectRaw('MAX(id)')
                    ->from('worker_locations')
                    ->where('workspace_id', $workspace->id)
                    ->groupBy('user_id');
            })
            ->latest('captured_at')
            ->get();

        $serviceLocations = $workspace->serviceLocations()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->with('customer:id,name')
            ->get([
                'id',
                'customer_id',
                'name',
                'address_line1',
                'city',
                'state',
                'postal_code',
                'latitude',
                'longitude',
                'access_notes',
            ]);

        $activeWorkOrders = $workspace->workOrders()
            ->whereNotIn('status', ['draft', 'completed', 'cancelled'])
            ->with([
                'customer:id,name,phone',
                'serviceLocation:id,name,address_line1,city,state,latitude,longitude',
                'assignedWorker:id,name,avatar_url',
            ])
            ->latest()
            ->take(30)
            ->get();

        $selectedWorkerId = $request->integer('worker_id');
        $selectedWorkerTrail = [];

        if ($selectedWorkerId) {
            $targetUser = $members->firstWhere('id', $selectedWorkerId);

            if ($targetUser && $request->user()->can('viewHistory', [WorkerLocation::class, $workspace, $targetUser])) {
                $selectedWorkerTrail = WorkerLocation::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('user_id', $selectedWorkerId)
                    ->where('captured_at', '>=', now()->subHours(24))
                    ->orderBy('captured_at', 'asc')
                    ->take(100)
                    ->get();
            }
        }

        $userRole = $workspace->getUserRole($request->user());

        return Inertia::render('locations/index', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
            ],
            'latestLocations' => $latestLocations,
            'serviceLocations' => $serviceLocations,
            'activeWorkOrders' => $activeWorkOrders,
            'teamMembers' => $members,
            'selectedWorkerId' => $selectedWorkerId ?: null,
            'selectedWorkerTrail' => $selectedWorkerTrail,
            'canManage' => in_array($userRole, ['owner', 'admin'], true),
            'userRole' => $userRole,
        ]);
    }

    /**
     * Store a new worker location ping for the current workspace.
     */
    public function store(StoreWorkerLocationRequest $request): JsonResponse|RedirectResponse
    {
        $workspace = $this->resolveWorkspace($request);

        $location = WorkerLocation::create([
            'workspace_id' => $workspace->id,
            'user_id' => $request->user()->id,
            'work_order_id' => $request->input('work_order_id'),
            'latitude' => $request->float('latitude'),
            'longitude' => $request->float('longitude'),
            'accuracy' => $request->has('accuracy') ? $request->float('accuracy') : null,
            'heading' => $request->has('heading') ? $request->float('heading') : null,
            'speed' => $request->has('speed') ? $request->float('speed') : null,
            'battery_level' => $request->input('battery_level'),
            'activity_type' => $request->input('activity_type', 'on_shift'),
            'captured_at' => now(),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Location updated successfully.',
                'location' => $location->load(['workOrder:id,order_number,title,status']),
            ], 201);
        }

        return back()->with('success', 'Location updated successfully.');
    }

    /**
     * Return live JSON coordinates for the workspace dispatch map.
     */
    public function live(Request $request): JsonResponse
    {
        $workspace = $this->resolveWorkspace($request);

        if (! $request->user()->can('viewAny', [WorkerLocation::class, $workspace])) {
            abort(403, 'Unauthorized.');
        }

        $latestLocations = WorkerLocation::query()
            ->where('workspace_id', $workspace->id)
            ->with(['user:id,name,email,avatar_url', 'workOrder:id,order_number,title,status'])
            ->whereIn('id', function ($sub) use ($workspace) {
                $sub->selectRaw('MAX(id)')
                    ->from('worker_locations')
                    ->where('workspace_id', $workspace->id)
                    ->groupBy('user_id');
            })
            ->latest('captured_at')
            ->get();

        return response()->json([
            'workspace_id' => $workspace->id,
            'timestamp' => now()->toIso8601String(),
            'locations' => $latestLocations,
        ]);
    }

    /**
     * Return historical breadcrumb route for a specific worker within this workspace.
     */
    public function history(Request $request, User $user): JsonResponse
    {
        $workspace = $this->resolveWorkspace($request);

        if (! $request->user()->can('viewHistory', [WorkerLocation::class, $workspace, $user])) {
            abort(403, 'Unauthorized to view this location history.');
        }

        $date = $request->input('date', now()->toDateString());

        $trail = WorkerLocation::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $user->id)
            ->whereDate('captured_at', $date)
            ->orderBy('captured_at', 'asc')
            ->get();

        return response()->json([
            'workspace_id' => $workspace->id,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'date' => $date,
            'points' => $trail,
        ]);
    }

    /**
     * Resolve the active workspace for this request.
     */
    protected function resolveWorkspace(Request $request): Workspace
    {
        $workspace = $request->attributes->get('workspace') ?? $request->user()?->currentWorkspace;

        if (! $workspace) {
            abort(400, 'No active workspace selected.');
        }

        return $workspace;
    }
}
