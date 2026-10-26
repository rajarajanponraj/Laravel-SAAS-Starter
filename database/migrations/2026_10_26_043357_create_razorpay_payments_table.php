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
        if (! Schema::hasTable('razorpay_payments')) {
            Schema::create('razorpay_payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('order_id')->unique();
                $table->string('payment_id')->nullable()->index();
                $table->string('signature')->nullable();
                $table->string('plan');
                $table->string('billing_period')->default('monthly');
                $table->unsignedBigInteger('amount');
                $table->string('currency', 10)->default('INR');
                $table->string('status')->default('created')->index();
                $table->string('method')->nullable();
                $table->string('receipt')->nullable();
                $table->json('notes')->nullable();
                $table->timestamps();

                $table->index(['workspace_id', 'status']);
            });
        }

        Schema::table('workspaces', function (Blueprint $table) {
            if (! Schema::hasColumn('workspaces', 'billing_gateway')) {
                $table->string('billing_gateway')->nullable()->after('plan_override');
            }
            if (! Schema::hasColumn('workspaces', 'billing_period')) {
                $table->string('billing_period')->nullable()->after('billing_gateway');
            }
            if (! Schema::hasColumn('workspaces', 'plan_expires_at')) {
                $table->timestamp('plan_expires_at')->nullable()->after('billing_period');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('razorpay_payments');

        Schema::table('workspaces', function (Blueprint $table) {
            if (Schema::hasColumn('workspaces', 'billing_gateway')) {
                $table->dropColumn('billing_gateway');
            }
            if (Schema::hasColumn('workspaces', 'billing_period')) {
                $table->dropColumn('billing_period');
            }
            if (Schema::hasColumn('workspaces', 'plan_expires_at')) {
                $table->dropColumn('plan_expires_at');
            }
        });
    }
};
