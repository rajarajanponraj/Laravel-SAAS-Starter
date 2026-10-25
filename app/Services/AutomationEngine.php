<?php

namespace App\Services;

use App\Jobs\ExecuteAutomationRuleJob;
use App\Models\AutomationExecution;
use App\Models\WorkOrder;

class AutomationEngine
{
    /**
     * Evaluate rules and dispatch idempotent automation jobs for a work order event.
     */
    public function trigger(string $event, WorkOrder $workOrder, ?string $contextKey = null): int
    {
        $workspace = $workOrder->workspace;
        if (! $workspace) {
            return 0;
        }

        $rules = $workspace->automationRules()
            ->where('trigger_event', $event)
            ->where('is_active', true)
            ->get();

        $dispatchedCount = 0;

        foreach ($rules as $rule) {
            if (! $rule->matchesWorkOrder($workOrder)) {
                continue;
            }

            $dateSuffix = $contextKey ?? (string) ($workOrder->updated_at?->timestamp ?? now()->timestamp);
            $idempotencyKey = "rule_{$rule->id}_wo_{$workOrder->id}_{$event}_{$dateSuffix}";

            // Check if already executed successfully for this exact event and key
            $existing = AutomationExecution::where('idempotency_key', $idempotencyKey)->first();
            if ($existing && $existing->status === 'success') {
                continue;
            }

            ExecuteAutomationRuleJob::dispatch($rule->id, $workOrder->id, $idempotencyKey);
            $dispatchedCount++;
        }

        return $dispatchedCount;
    }
}
