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
        if (Schema::hasTable('service_locations')) {
            Schema::table('service_locations', function (Blueprint $table) {
                if (! Schema::hasColumn('service_locations', 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable()->after('country');
                }
                if (! Schema::hasColumn('service_locations', 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
                }
            });
        }

        if (! Schema::hasTable('worker_locations')) {
            Schema::create('worker_locations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('work_order_id')->nullable()->constrained('work_orders')->nullOnDelete();
                $table->decimal('latitude', 10, 7);
                $table->decimal('longitude', 10, 7);
                $table->float('accuracy')->nullable();
                $table->float('heading')->nullable();
                $table->float('speed')->nullable();
                $table->unsignedTinyInteger('battery_level')->nullable();
                $table->string('activity_type', 30)->default('on_shift');
                $table->timestamp('captured_at')->useCurrent();
                $table->timestamps();

                $table->index(['workspace_id', 'user_id', 'captured_at'], 'idx_wl_ws_user_cap');
                $table->index(['workspace_id', 'captured_at'], 'idx_wl_ws_cap');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('worker_locations');

        if (Schema::hasTable('service_locations')) {
            Schema::table('service_locations', function (Blueprint $table) {
                if (Schema::hasColumn('service_locations', 'longitude')) {
                    $table->dropColumn('longitude');
                }
                if (Schema::hasColumn('service_locations', 'latitude')) {
                    $table->dropColumn('latitude');
                }
            });
        }
    }
};
