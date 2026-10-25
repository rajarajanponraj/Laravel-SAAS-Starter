<?php

use App\Enums\WorkOrderStatus;
use App\Jobs\ExecuteAutomationRuleJob;
use App\Mail\WorkOrderNotificationMail;
use App\Models\AutomationExecution;
use App\Models\AutomationRule;
use App\Models\Customer;
use App\Models\NotificationDelivery;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\Workspace;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

test('owner can create automation rule via http endpoint', function () {
    $workspace = Workspace::factory()->create([
        'plan_override' => 'pro',
    ]);
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $response = $this->actingAs($owner)->post(route('automations.store'), [
        'name' => 'Notify Dispatcher when Job Submitted',
        'trigger_event' => 'work_order.submitted',
        'conditions' => ['priority' => 'urgent'],
        'action_type' => 'send_notification',
        'action_config' => [
            'subject' => 'Urgent Work Order Ready for Review',
            'recipient' => 'manager',
            'message' => 'Please inspect and approve urgent job promptly.',
        ],
    ]);

    $response->assertSessionHasNoErrors();
    $rule = AutomationRule::where('name', 'Notify Dispatcher when Job Submitted')->first();
    expect($rule)->not->toBeNull();
    expect($rule->trigger_event)->toBe('work_order.submitted');
    expect($rule->is_active)->toBeTrue();
    expect($rule->conditions)->toBe(['priority' => 'urgent']);
});

test('rule toggle enables and disables automation execution', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $rule = AutomationRule::factory()->create([
        'workspace_id' => $workspace->id,
        'is_active' => true,
    ]);

    $response = $this->actingAs($owner)->put(route('automations.toggle', $rule));
    $response->assertSessionHasNoErrors();
    expect($rule->fresh()->is_active)->toBeFalse();

    $response2 = $this->actingAs($owner)->put(route('automations.toggle', $rule));
    $response2->assertSessionHasNoErrors();
    expect($rule->fresh()->is_active)->toBeTrue();
});

test('idempotent automation execution prevents duplicate notifications on retries', function () {
    Mail::fake();

    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);
    $owner->update(['current_workspace_id' => $workspace->id]);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'title' => 'Emergency Pipe Burst',
    ]);

    $rule = AutomationRule::factory()->create([
        'workspace_id' => $workspace->id,
        'trigger_event' => 'work_order.submitted',
        'action_type' => 'send_notification',
        'action_config' => [
            'subject' => 'Emergency Job Finished',
            'recipient' => 'manager',
            'message' => 'Review required.',
        ],
        'is_active' => true,
    ]);

    $idempotencyKey = "rule_{$rule->id}_wo_{$job->id}_work_order.submitted_12345";

    // 1. First execution
    ExecuteAutomationRuleJob::dispatchSync($rule->id, $job->id, $idempotencyKey);

    expect(AutomationExecution::where('idempotency_key', $idempotencyKey)->count())->toBe(1);
    $execution = AutomationExecution::where('idempotency_key', $idempotencyKey)->first();
    expect($execution->status)->toBe('success');
    expect(NotificationDelivery::where('workspace_id', $workspace->id)->count())->toBe(1);
    Mail::assertSent(WorkOrderNotificationMail::class, 1);

    // 2. Retry with identical idempotency key (simulating queue redelivery)
    ExecuteAutomationRuleJob::dispatchSync($rule->id, $job->id, $idempotencyKey);

    // Assert NO duplicate notification was sent and execution count remains 1
    expect(AutomationExecution::where('idempotency_key', $idempotencyKey)->count())->toBe(1);
    expect(NotificationDelivery::where('workspace_id', $workspace->id)->count())->toBe(1);
    Mail::assertSent(WorkOrderNotificationMail::class, 1);
});

test('disabled automation rule skips execution and sends nothing', function () {
    Mail::fake();

    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
    ]);

    $rule = AutomationRule::factory()->create([
        'workspace_id' => $workspace->id,
        'is_active' => false, // Disabled!
    ]);

    $idempotencyKey = "rule_{$rule->id}_wo_{$job->id}_disabled_test";

    ExecuteAutomationRuleJob::dispatchSync($rule->id, $job->id, $idempotencyKey);

    $execution = AutomationExecution::where('idempotency_key', $idempotencyKey)->first();
    expect($execution)->not->toBeNull();
    expect($execution->status)->toBe('skipped');
    Mail::assertNothingSent();
    expect(NotificationDelivery::count())->toBe(0);
});

test('follow-up action rule creates new draft work order', function () {
    $workspace = Workspace::factory()->create();
    $owner = User::factory()->create();
    $workspace->users()->attach($owner, ['role' => 'owner']);

    $customer = Customer::factory()->create(['workspace_id' => $workspace->id]);
    $job = WorkOrder::factory()->create([
        'workspace_id' => $workspace->id,
        'customer_id' => $customer->id,
        'order_number' => 'WO-0001',
        'title' => 'Initial Solar Installation',
    ]);

    $rule = AutomationRule::factory()->create([
        'workspace_id' => $workspace->id,
        'action_type' => 'create_follow_up',
        'is_active' => true,
    ]);

    $idempotencyKey = "rule_{$rule->id}_wo_{$job->id}_follow_up_test";

    ExecuteAutomationRuleJob::dispatchSync($rule->id, $job->id, $idempotencyKey);

    $followUpJob = WorkOrder::where('title', 'Follow-up: Initial Solar Installation')->first();
    expect($followUpJob)->not->toBeNull();
    expect($followUpJob->order_number)->toBe('WO-0002');
    expect($followUpJob->status)->toBe(WorkOrderStatus::Draft);
    expect($followUpJob->customer_id)->toBe($customer->id);
});
