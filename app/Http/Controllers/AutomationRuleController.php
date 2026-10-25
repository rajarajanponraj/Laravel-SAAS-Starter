<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAutomationRuleRequest;
use App\Models\AutomationRule;
use App\Services\PlanLimitService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AutomationRuleController extends Controller
{
    public function __construct(
        protected PlanLimitService $planLimitService
    ) {}

    /**
     * Display a listing of automation rules and recent executions.
     */
    public function index(Request $request): Response
    {
        $workspace = $request->user()->currentWorkspace;
        Gate::authorize('viewAny', [AutomationRule::class, $workspace]);

        $rules = $workspace->automationRules()
            ->withCount('executions')
            ->latest()
            ->paginate(15);

        $recentExecutions = $workspace->automationExecutions()
            ->with(['rule', 'workOrder'])
            ->latest()
            ->take(20)
            ->get();

        $role = $workspace->getUserRole($request->user());

        return Inertia::render('automations/index', [
            'rules' => $rules,
            'recentExecutions' => $recentExecutions,
            'canManage' => in_array($role, ['owner', 'admin'], true),
        ]);
    }

    /**
     * Store a newly created automation rule.
     */
    public function store(StoreAutomationRuleRequest $request): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        Gate::authorize('create', [AutomationRule::class, $workspace]);

        if (! $this->planLimitService->canCreateAutomationRule($workspace)) {
            throw ValidationException::withMessages([
                'plan' => 'Automation rules are available on paid plans or your plan limit has been reached. Please upgrade your subscription.',
            ]);
        }

        $workspace->automationRules()->create($request->validated());

        return back()->with('success', 'Automation rule created successfully.');
    }

    /**
     * Toggle the active state of an automation rule.
     */
    public function toggle(Request $request, AutomationRule $automationRule): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($automationRule->workspace_id === $workspace->id, 404);
        Gate::authorize('update', $automationRule);

        $automationRule->is_active = ! $automationRule->is_active;
        $automationRule->save();

        $statusLabel = $automationRule->is_active ? 'enabled' : 'disabled';

        return back()->with('success', "Automation rule {$statusLabel}.");
    }

    /**
     * Remove the specified automation rule.
     */
    public function destroy(Request $request, AutomationRule $automationRule): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($automationRule->workspace_id === $workspace->id, 404);
        Gate::authorize('delete', $automationRule);

        $automationRule->delete();

        return back()->with('success', 'Automation rule deleted.');
    }
}
