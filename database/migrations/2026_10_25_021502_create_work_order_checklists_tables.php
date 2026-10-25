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
        if (! Schema::hasTable('work_order_checklists')) {
            Schema::create('work_order_checklists', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
                $table->foreignId('work_order_id')->constrained('work_orders')->cascadeOnDelete();
                $table->foreignId('checklist_template_id')->nullable()->constrained('checklist_templates')->nullOnDelete();
                $table->string('name');
                $table->timestamps();

                $table->index(['workspace_id', 'work_order_id']);
            });
        }

        if (! Schema::hasTable('work_order_checklist_items')) {
            Schema::create('work_order_checklist_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('work_order_checklist_id')->constrained('work_order_checklists')->cascadeOnDelete();
                $table->string('label');
                $table->string('type')->default('checkbox'); // checkbox, text, number
                $table->boolean('is_required')->default(false);
                $table->boolean('is_completed')->default(false);
                $table->timestamp('completed_at')->nullable();
                $table->foreignId('completed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('text_response')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['work_order_checklist_id', 'is_completed'], 'woci_checklist_completed_idx');
                $table->index(['work_order_checklist_id', 'sort_order'], 'woci_checklist_sort_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_order_checklist_items');
        Schema::dropIfExists('work_order_checklists');
    }
};
