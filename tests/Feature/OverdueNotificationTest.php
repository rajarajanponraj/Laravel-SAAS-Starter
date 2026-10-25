<?php

use App\Enums\WorkOrderStatus;
use App\Mail\WorkOrderNotificationMail;
use App\Models\AutomationRule;
use App\Models\Customer;
use App\Models\NotificationDelivery;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\Workspace;
use Illuminate\Support\Facades\Mail;

test('overdue work orders command detects past-due jobs and triggers automation', function () {
    Mail::fake();

    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);

    // Overdue active job
    $overdueJob = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'order_number' => 'WO-0010',
        'title' => 'Critical Elevator Repair',
        'status' => WorkOrderStatus::InProgress,
        'due_date' => now()->subDays(2)->toDateString(),
    ]);

    // Future job (not overdue)
    $futureJob = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'order_number' => 'WO-0011',
        'title' => 'Future Inspection',
        'status' => WorkOrderStatus::Assigned,
        'due_date' => now()->addDays(4)->toDateString(),
    ]);

    // Already completed job (should not trigger overdue)
    $completedJob = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'order_number' => 'WO-0012',
        'title' => 'Old Finished Repair',
        'status' => WorkOrderStatus::Completed,
        'due_date' => now()->subDays(5)->toDateString(),
    ]);

    // Create overdue automation rule
    $rule = AutomationRule::factory()->create([
        'workspace_id' => $workspace->id,
        'trigger_event' => 'work_order.overdue',
        'action_type' => 'send_notification',
        'action_config' => [
            'subject' => 'CRITICAL: Job Overdue',
            'recipient' => 'manager',
            'message' => 'This job has exceeded its scheduled completion date.',
        ],
        'is_active' => true,
    ]);

    // 1. Run the command
    $this->artisan('app:check-overdue-work-orders')
        ->expectsOutputToContain('Found 1 overdue work orders')
        ->assertSuccessful();

    // Verify email was sent and notification delivery recorded
    Mail::assertSent(WorkOrderNotificationMail::class, 1);
    expect(NotificationDelivery::where('workspace_id', $workspace->id)->count())->toBe(1);

    $delivery = NotificationDelivery::first();
    expect($delivery->type)->toBe('work_order.overdue');
    expect($delivery->recipient_email)->toBe($owner->email);

    // 2. Re-run command on the same day -> idempotency key prevents duplicate execution
    $this->artisan('app:check-overdue-work-orders')
        ->expectsOutputToContain('Found 1 overdue work orders')
        ->assertSuccessful();

    // Mail count should remain 1, not 2
    Mail::assertSent(WorkOrderNotificationMail::class, 1);
    expect(NotificationDelivery::where('workspace_id', $workspace->id)->count())->toBe(1);
});
