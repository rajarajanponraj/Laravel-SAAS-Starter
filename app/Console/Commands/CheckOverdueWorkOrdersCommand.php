<?php

namespace App\Console\Commands;

use App\Models\WorkOrder;
use App\Services\AutomationEngine;
use Illuminate\Console\Command;

class CheckOverdueWorkOrdersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-overdue-work-orders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan active work orders for approaching deadlines or overdue status and dispatch automations';

    /**
     * Execute the console command.
     */
    public function handle(AutomationEngine $engine): int
    {
        $today = now()->toDateString();

        $overdueJobs = WorkOrder::query()
            ->overdue()
            ->with(['workspace', 'customer', 'assignedWorker'])
            ->get();

        $this->info("Found {$overdueJobs->count()} overdue work orders as of {$today}.");

        $totalDispatched = 0;

        foreach ($overdueJobs as $job) {
            $dispatched = $engine->trigger('work_order.overdue', $job, $today);
            $totalDispatched += $dispatched;
        }

        $this->info("Dispatched {$totalDispatched} overdue automation jobs.");

        return Command::SUCCESS;
    }
}
