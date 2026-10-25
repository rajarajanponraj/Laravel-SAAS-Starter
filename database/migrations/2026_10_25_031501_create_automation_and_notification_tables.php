<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('automation_rules')) {
            Schema::create('automation_rules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('trigger_event'); // work_order.assigned, work_order.submitted, work_order.approved, work_order.changes_requested, work_order.overdue
                $table->json('conditions')->nullable(); // e.g. {"priority": "urgent"}
                $table->string('action_type'); // send_notification, create_follow_up
                $table->json('action_config'); // e.g. {"subject": "...", "recipient": "manager"}
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['workspace_id', 'is_active']);
                $table->index(['workspace_id', 'trigger_event']);
            });
        }

        if (! Schema::hasTable('automation_executions')) {
            Schema::create('automation_executions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
                $table->foreignId('automation_rule_id')->constrained('automation_rules')->cascadeOnDelete();
                $table->foreignId('work_order_id')->constrained('work_orders')->cascadeOnDelete();
                $table->string('idempotency_key')->unique();
                $table->string('status')->default('pending'); // pending, success, failed, skipped
                $table->text('error_message')->nullable();
                $table->timestamp('executed_at')->nullable();
                $table->timestamps();

                $table->index(['workspace_id', 'automation_rule_id']);
                $table->index(['work_order_id', 'status']);
            });
        }

        if (! Schema::hasTable('notification_deliveries')) {
            Schema::create('notification_deliveries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('channel')->default('email'); // email, in_app
                $table->string('type'); // work_order_assigned, work_order_overdue, work_order_submitted, work_order_approved, work_order_changes_requested
                $table->string('subject');
                $table->string('recipient_email');
                $table->string('status')->default('queued'); // queued, sent, failed
                $table->text('error_message')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();

                $table->index(['workspace_id', 'status']);
                $table->index(['recipient_email', 'type']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_deliveries');
        Schema::dropIfExists('automation_executions');
        Schema::dropIfExists('automation_rules');
    }
};
