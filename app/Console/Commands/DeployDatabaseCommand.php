<?php

namespace App\Console\Commands;

use App\Models\ChecklistTemplate;
use App\Models\User;
use App\Services\WorkspaceService;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DeployDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:deploy 
                            {--seed-if-empty : Automatically seed superadmin & starter workspace if the database is brand new}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely backup database, execute migrations with rollback safety, and seed initial tenant if empty.';

    public function handle(WorkspaceService $workspaceService): int
    {
        $this->info('==> [CrewFlow DB Deploy] Starting database deployment routine...');

        // 1. Ensure backup directory exists
        $backupDir = storage_path('app/backups');
        if (! File::isDirectory($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        // 2. Perform automated database backup before touching migrations
        $this->performBackup($backupDir);

        // 3. Execute migrations
        $this->info('==> Running database migrations (--force)...');
        try {
            $migrateExit = Artisan::call('migrate', [
                '--force' => true,
                '--no-interaction' => true,
            ]);

            $this->line(Artisan::output());

            if ($migrateExit !== 0) {
                $this->error('Database migration failed with exit code: '.$migrateExit);

                return 1;
            }
        } catch (Exception $e) {
            $this->error('Migration error: '.$e->getMessage());

            return 1;
        }

        // 4. Check if initial seeding is needed
        if ($this->option('seed-if-empty')) {
            $this->seedInitialDataIfEmpty($workspaceService);
        }

        $this->info('==> [CrewFlow DB Deploy] Database deployment completed successfully.');

        return 0;
    }

    /**
     * Create an automated timestamped backup of the database.
     */
    protected function performBackup(string $backupDir): void
    {
        $connection = config('database.default');
        $timestamp = now()->format('Y-m-d_His');

        $this->info("==> Taking database snapshot (driver: {$connection})...");

        if ($connection === 'sqlite') {
            $dbPath = config('database.connections.sqlite.database');

            // Skip file copy if in-memory test database
            if ($dbPath === ':memory:') {
                $this->line('In-memory SQLite database detected. Snapshot skipped.');
            } elseif (! File::exists($dbPath)) {
                // If SQLite file doesn't exist yet, create it
                File::ensureDirectoryExists(dirname($dbPath));
                File::put($dbPath, '');
                $this->info("Created new SQLite database file at: {$dbPath}");
            } elseif (File::size($dbPath) > 0) {
                $backupFile = "{$backupDir}/db-backup-{$timestamp}.sqlite";
                File::copy($dbPath, $backupFile);
                $this->info("Backup saved: {$backupFile} (".round(File::size($backupFile) / 1024, 1).' KB)');
            }
        } elseif ($connection === 'mysql') {
            $dbName = config('database.connections.mysql.database');
            $dbUser = config('database.connections.mysql.username');
            $dbPass = config('database.connections.mysql.password');
            $dbHost = config('database.connections.mysql.host', '127.0.0.1');
            $dbPort = config('database.connections.mysql.port', 3306);

            $backupFile = "{$backupDir}/db-backup-{$timestamp}.sql";

            // Attempt mysqldump if CLI utility is available
            $mysqldumpPath = exec('which mysqldump 2>/dev/null');
            if ($mysqldumpPath) {
                $cmd = sprintf(
                    '%s -h %s -P %s -u %s %s %s > %s 2>/dev/null',
                    escapeshellcmd($mysqldumpPath),
                    escapeshellarg($dbHost),
                    escapeshellarg($dbPort),
                    escapeshellarg($dbUser),
                    $dbPass ? '-p'.escapeshellarg($dbPass) : '',
                    escapeshellarg($dbName),
                    escapeshellarg($backupFile)
                );
                exec($cmd, $output, $resultCode);

                if ($resultCode === 0 && File::exists($backupFile) && File::size($backupFile) > 0) {
                    $this->info("Backup saved via mysqldump: {$backupFile}");
                } else {
                    $this->line('mysqldump skipped or not applicable (database might be new).');
                }
            }
        }

        // Prune older backups keeping the 10 most recent
        $this->pruneOldBackups($backupDir);
    }

    /**
     * Keep only the 10 most recent backups to conserve disk space.
     */
    protected function pruneOldBackups(string $backupDir): void
    {
        $files = File::files($backupDir);
        if (count($files) > 10) {
            usort($files, fn ($a, $b) => $b->getMTime() <=> $a->getMTime());
            $filesToDelete = array_slice($files, 10);
            foreach ($filesToDelete as $file) {
                File::delete($file->getPathname());
            }
            $this->line('Pruned '.count($filesToDelete).' older database backup(s).');
        }
    }

    /**
     * Seed superadmin user and default workspace on first deploy if database is empty.
     */
    protected function seedInitialDataIfEmpty(WorkspaceService $workspaceService): void
    {
        $userCount = User::count();

        if ($userCount > 0) {
            $this->info("Database already contains {$userCount} user(s). Initial seeding skipped.");

            return;
        }

        $this->info('==> Fresh database detected. Provisioning initial Superadmin and Workspace...');

        $adminEmail = env('ADMIN_EMAIL', 'admin@crm.bytebunkers.sbs');
        $initialPassword = env('ADMIN_INITIAL_PASSWORD') ?: Str::random(16);

        DB::transaction(function () use ($workspaceService, $adminEmail, $initialPassword) {
            // 1. Create Superadmin User
            $superadmin = User::create([
                'name' => 'CrewFlow Admin',
                'email' => $adminEmail,
                'password' => Hash::make($initialPassword),
                'email_verified_at' => now(),
                'locale' => 'en',
                'is_superadmin' => true,
                'onboarded_at' => now(),
            ]);

            // 2. Create Default Team Workspace
            $workspace = $workspaceService->create($superadmin, [
                'name' => 'CrewFlow Operations',
            ]);
            $workspace->update(['plan_override' => 'pro']);

            // 3. Create Standard Checklist Templates for Field Service
            $safetyTemplate = ChecklistTemplate::create([
                'workspace_id' => $workspace->id,
                'name' => 'Site Safety & Pre-Start Inspection',
                'description' => 'Mandatory pre-service safety checklist before starting any field job.',
                'is_active' => true,
            ]);

            $safetyTemplate->items()->createMany([
                ['label' => 'Inspect PPE & protective gear (gloves, safety glasses, boots)', 'type' => 'checkbox', 'is_required' => true, 'sort_order' => 0],
                ['label' => 'Confirm power disconnect / isolation procedure', 'type' => 'checkbox', 'is_required' => true, 'sort_order' => 1],
                ['label' => 'Customer access notes and site hazard check', 'type' => 'text', 'is_required' => false, 'sort_order' => 2],
            ]);

            $completionTemplate = ChecklistTemplate::create([
                'workspace_id' => $workspace->id,
                'name' => 'Job Completion & Signoff',
                'description' => 'Final quality assurance and evidence capture before submitting for supervisor review.',
                'is_active' => true,
            ]);

            $completionTemplate->items()->createMany([
                ['label' => 'Work area cleaned and tools accounted for', 'type' => 'checkbox', 'is_required' => true, 'sort_order' => 0],
                ['label' => 'Photo evidence captured and uploaded', 'type' => 'checkbox', 'is_required' => true, 'sort_order' => 1],
                ['label' => 'Workmanship summary / diagnostic readings', 'type' => 'text', 'is_required' => true, 'sort_order' => 2],
            ]);

            // 4. Save initial credentials file
            $credsFile = storage_path('logs/initial_credentials.txt');
            $credsContent = "CrewFlow Initial Superadmin Credentials\n"
                ."========================================\n"
                .'Generated At : '.now()->toDateTimeString()."\n"
                .'Login URL    : '.config('app.url')."/login\n"
                ."Email        : {$adminEmail}\n"
                ."Password     : {$initialPassword}\n"
                ."========================================\n"
                ."Please change your password immediately after first login.\n";

            File::put($credsFile, $credsContent);
            @chmod($credsFile, 0600);

            $this->info('----------------------------------------------------');
            $this->info("SUPERADMIN CREATED: {$adminEmail}");
            $this->info("INITIAL PASSWORD  : {$initialPassword}");
            $this->info("Saved to: {$credsFile}");
            $this->info('----------------------------------------------------');
        });
    }
}
