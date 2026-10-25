<?php

namespace App\Http\Controllers;

use App\Http\Requests\UploadEvidenceRequest;
use App\Models\WorkOrder;
use App\Models\WorkOrderEvidence;
use App\Services\EvidenceStorageService;
use App\Services\PlanLimitService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WorkOrderEvidenceController extends Controller
{
    public function __construct(
        protected EvidenceStorageService $storageService,
        protected PlanLimitService $planLimitService,
    ) {}

    /**
     * Upload an evidence file to a work order.
     */
    public function store(UploadEvidenceRequest $request, WorkOrder $workOrder): RedirectResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;
        abort_unless($workOrder->workspace_id === $workspace->id, 404);
        Gate::authorize('create', [WorkOrderEvidence::class, $workOrder]);

        $file = $request->file('file');
        $notes = $request->validated('notes');

        if (! $this->planLimitService->canUploadEvidence($workspace, $file->getSize())) {
            throw ValidationException::withMessages([
                'file' => 'Evidence storage limit reached for your subscription plan. Please upgrade to upload more files.',
            ]);
        }

        $this->storageService->store(
            workOrder: $workOrder,
            file: $file,
            uploader: $user,
            notes: $notes,
        );

        return back()->with('success', 'Evidence file uploaded successfully.');
    }

    /**
     * Securely download or stream an evidence file with authorization check.
     */
    public function download(Request $request, WorkOrder $workOrder, WorkOrderEvidence $evidence): StreamedResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;

        abort_unless($workOrder->workspace_id === $workspace->id, 404);
        abort_unless($evidence->work_order_id === $workOrder->id, 404);
        abort_unless($evidence->workspace_id === $workspace->id, 404);

        Gate::authorize('view', $evidence);

        $inline = ! $request->boolean('download');

        return $this->storageService->download($evidence, $inline);
    }

    /**
     * Remove the specified evidence record and file.
     */
    public function destroy(Request $request, WorkOrder $workOrder, WorkOrderEvidence $evidence): RedirectResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;

        abort_unless($workOrder->workspace_id === $workspace->id, 404);
        abort_unless($evidence->work_order_id === $workOrder->id, 404);
        abort_unless($evidence->workspace_id === $workspace->id, 404);

        Gate::authorize('delete', $evidence);

        $this->storageService->delete($evidence);

        return back()->with('success', 'Evidence removed.');
    }
}
