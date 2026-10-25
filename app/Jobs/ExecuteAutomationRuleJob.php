<?php

namespace App\Jobs;

use App\Enums\WorkOrderPriority;
use App\Enums\WorkOrderStatus;
use App\Mail\WorkOrderNotificationMail;
use App\Models\AutomationExecution;
use App\Models\AutomationRule;
use App\Models\NotificationDelivery;
use App\Models\WorkOrder;
use App\Services\WorkOrderNumberGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ExecuteAutomationRuleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $ruleId,
        public int $workOrderId,
        public string $idempotencyKey
    ) {}

    /**
     * Execute the job.
     */
    public function handle(WorkOrderNumberGenerator $numberGenerator): void
    {
        // 1. Idempotency Check: prevent duplicate runs
        $execution = AutomationExecution::firstOrCreate(
            ['idempotency_key' => $this->idempotencyKey],
            [
                'workspace_id' => 1, // temporary placeholder, updated below
                'automation_rule_id' => $this->ruleId,
                'work_order_id' => $this->workOrderId,
                'status' => 'pending',
            ]
        );

        if ($execution->status === 'success') {
            return; // Already completed idempotently
        }

        $rule = AutomationRule::find($this->ruleId);
        $workOrder = WorkOrder::with(['customer', 'assignedWorker', 'workspace.owner'])->find($this->workOrderId);

        if (! $rule || ! $workOrder) {
            $execution->update([
                'status' => 'skipped',
                'error_message' => 'Rule or Work Order record was deleted.',
                'executed_at' => now(),
            ]);

            return;
        }

        // Verify tenant boundary
        if ($rule->workspace_id !== $workOrder->workspace_id) {
            $execution->update([
                'status' => 'failed',
                'error_message' => 'Tenant boundary mismatch between rule and work order.',
                'executed_at' => now(),
            ]);

            return;
        }

        // Update workspace ID on execution
        $execution->update(['workspace_id' => $workOrder->workspace_id]);

        if (! $rule->is_active) {
            $execution->update([
                'status' => 'skipped',
                'error_message' => 'Automation rule is disabled.',
                'executed_at' => now(),
            ]);

            return;
        }

        try {
            $actionConfig = $rule->action_config ?? [];

            if ($rule->action_type === 'send_notification') {
                $recipientType = $actionConfig['recipient'] ?? 'manager';
                $recipientEmail = null;
                $recipientUser = null;

                if ($recipientType === 'worker') {
                    $recipientEmail = $workOrder->assignedWorker?->email;
                    $recipientUser = $workOrder->assignedWorker;
                } elseif ($recipientType === 'customer') {
                    $recipientEmail = $workOrder->customer?->email;
                } else {
                    $recipientEmail = $workOrder->workspace->owner?->email;
                    $recipientUser = $workOrder->workspace->owner;
                }

                if ($recipientEmail) {
                    $subject = $actionConfig['subject'] ?? "Update on Work Order {$workOrder->order_number}";
                    $message = $actionConfig['message'] ?? "This is an automated notification regarding {$workOrder->title}.";

                    Mail::to($recipientEmail)->send(new WorkOrderNotificationMail(
                        workOrder: $workOrder,
                        notificationSubject: $subject,
                        notificationMessage: $message
                    ));

                    NotificationDelivery::create([
                        'workspace_id' => $workOrder->workspace_id,
                        'user_id' => $recipientUser?->id,
                        'channel' => 'email',
                        'type' => $rule->trigger_event,
                        'subject' => $subject,
                        'recipient_email' => $recipientEmail,
                        'status' => 'sent',
                        'sent_at' => now(),
                    ]);
                }
            } elseif ($rule->action_type === 'create_follow_up') {
                $followUpNumber = $numberGenerator->generate($workOrder->workspace);
                WorkOrder::create([
                    'workspace_id' => $workOrder->workspace_id,
                    'customer_id' => $workOrder->customer_id,
                    'service_location_id' => $workOrder->service_location_id,
                    'order_number' => $followUpNumber,
                    'title' => "Follow-up: {$workOrder->title}",
                    'description' => "Automated follow-up created from {$workOrder->order_number}.",
                    'priority' => WorkOrderPriority::Medium,
                    'status' => WorkOrderStatus::Draft,
                    'due_date' => now()->addDays(14)->toDateString(),
                    'created_by_user_id' => $workOrder->created_by_user_id,
                ]);
            }

            $execution->update([
                'status' => 'success',
                'executed_at' => now(),
                'error_message' => null,
            ]);
        } catch (Throwable $e) {
            $execution->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'executed_at' => now(),
            ]);

            throw $e;
        }
    }
}
