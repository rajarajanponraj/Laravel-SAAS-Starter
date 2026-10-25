<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreChecklistTemplateRequest;
use App\Models\ChecklistTemplate;
use App\Services\PlanLimitService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ChecklistTemplateController extends Controller
{
    public function __construct(
        protected PlanLimitService $planLimitService
    ) {}

    /**
     * Display a listing of checklist templates in the workspace.
     */
    public function index(Request $request): Response
    {
        $workspace = $request->user()->currentWorkspace;
        Gate::authorize('viewAny', [ChecklistTemplate::class, $workspace]);

        $templates = $workspace->checklistTemplates()
            ->with(['items'])
            ->latest()
            ->paginate(15);

        $role = $workspace->getUserRole($request->user());

        return Inertia::render('checklists/index', [
            'templates' => $templates,
            'canManage' => in_array($role, ['owner', 'admin'], true),
        ]);
    }

    /**
     * Store a new checklist template and its items.
     */
    public function store(StoreChecklistTemplateRequest $request): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        Gate::authorize('create', [ChecklistTemplate::class, $workspace]);

        if (! $this->planLimitService->canCreateChecklistTemplate($workspace)) {
            throw ValidationException::withMessages([
                'plan' => 'Checklist template limit reached for your subscription plan. Please upgrade to create more custom templates.',
            ]);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($workspace, $validated) {
            $template = $workspace->checklistTemplates()->create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'is_active' => true,
            ]);

            foreach ($validated['items'] as $index => $itemData) {
                $template->items()->create([
                    'label' => $itemData['label'],
                    'description' => $itemData['description'] ?? null,
                    'type' => $itemData['type'],
                    'is_required' => $itemData['is_required'] ?? false,
                    'sort_order' => $itemData['sort_order'] ?? $index,
                ]);
            }
        });

        return back()->with('success', 'Checklist template created successfully.');
    }

    /**
     * Remove the specified checklist template.
     */
    public function destroy(Request $request, ChecklistTemplate $checklistTemplate): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($checklistTemplate->workspace_id === $workspace->id, 404);
        Gate::authorize('delete', $checklistTemplate);

        $checklistTemplate->delete();

        return back()->with('success', 'Checklist template deleted successfully.');
    }
}
