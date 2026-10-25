<?php

use App\Http\Controllers\Api\HealthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::get('/debug-error', function () {
    $logFile = storage_path('logs/laravel.log');
    $logExists = file_exists($logFile);
    $lastLines = $logExists ? array_slice(file($logFile), -40) : [];

    $tests = [];
    try {
        $tests['app_key_set'] = ! empty(config('app.key'));
        $tests['app_key_prefix'] = substr(config('app.key') ?: '', 0, 10);
        $tests['session_driver'] = config('session.driver');
        $tests['cache_store'] = config('cache.default');
        $tests['database_name'] = DB::connection()->getDatabaseName();
        $tests['storage_writable'] = is_writable(storage_path());
        $tests['sessions_table_exists'] = Schema::hasTable('sessions');
        $tests['cache_table_exists'] = Schema::hasTable('cache');
    } catch (Throwable $e) {
        $tests['test_error'] = $e->getMessage();
    }

    return response()->json([
        'log_exists' => $logExists,
        'last_log_lines' => $lastLines,
        'diagnostics' => $tests,
    ]);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| Workspace API v1 (authenticated via workspace API keys)
|--------------------------------------------------------------------------
|
| These routes are authenticated using the wsk_ workspace API keys
| generated in the workspace settings. Each route requires the
| api-key middleware with the appropriate scope.
|
*/
use App\Http\Controllers\Api\V1\WorkspaceController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

Route::prefix('v1')->middleware('api-key:read')->group(function () {
    Route::get('/workspace', [WorkspaceController::class, 'show']);
    Route::get('/members', [WorkspaceController::class, 'members']);
});
