<?php

use App\Models\ChecklistTemplate;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\File;

beforeEach(function () {
    // Clean up test backup directory
    $backupDir = storage_path('app/backups');
    if (File::isDirectory($backupDir)) {
        File::cleanDirectory($backupDir);
    }
});

test('db:deploy command creates database backup and runs migrations', function () {
    $exitCode = $this->artisan('db:deploy');

    $exitCode->assertExitCode(0);

    // Verify backup folder exists
    $backupDir = storage_path('app/backups');
    expect(File::isDirectory($backupDir))->toBeTrue();
});

test('db:deploy --seed-if-empty provisions superadmin, workspace and checklists when database is fresh', function () {
    // Ensure 0 users
    User::query()->delete();
    Workspace::query()->delete();

    $this->artisan('db:deploy', ['--seed-if-empty' => true])
        ->expectsOutputToContain('Fresh database detected. Provisioning initial Superadmin and Workspace...')
        ->assertExitCode(0);

    $admin = User::where('is_superadmin', true)->first();
    expect($admin)->not->toBeNull();
    expect($admin->email)->toBe('admin@bytebunkers.sbs');

    $workspace = Workspace::where('name', 'CrewFlow Operations')->first();
    expect($workspace)->not->toBeNull();
    expect($workspace->owner_id)->toBe($admin->id);

    // Verify checklist templates created
    $templates = ChecklistTemplate::where('workspace_id', $workspace->id)->get();
    expect($templates->count())->toBe(2);

    // Verify credentials file created
    $credsFile = storage_path('logs/initial_credentials.txt');
    expect(File::exists($credsFile))->toBeTrue();
    expect(File::get($credsFile))->toContain('CrewFlow Initial Superadmin Credentials');
});

test('db:deploy --seed-if-empty skips seeding when database already contains users', function () {
    // Create an existing user
    User::factory()->create(['email' => 'existing@example.com']);
    expect(User::count())->toBeGreaterThan(0);

    $this->artisan('db:deploy', ['--seed-if-empty' => true])
        ->expectsOutputToContain('Initial seeding skipped.')
        ->assertExitCode(0);
});

test('db:deploy prunes old backups keeping maximum 10 latest files', function () {
    $backupDir = storage_path('app/backups');
    File::ensureDirectoryExists($backupDir);

    // Create 15 fake backup files
    for ($i = 1; $i <= 15; $i++) {
        File::put("{$backupDir}/db-backup-2026-01-".str_pad((string) $i, 2, '0', STR_PAD_LEFT).'.sqlite', "backup {$i}");
    }

    expect(count(File::files($backupDir)))->toBe(15);

    $this->artisan('db:deploy')->assertExitCode(0);

    // Pruned to 10
    expect(count(File::files($backupDir)))->toBeLessThanOrEqual(10);
});
