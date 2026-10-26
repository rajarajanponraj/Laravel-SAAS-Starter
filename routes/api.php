<?php

use App\Http\Controllers\Api\HealthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::get('/mail-status', function () {
    $default = config('mail.default', 'log');
    $smtp = config("mail.mailers.{$default}", []);
    $host = $smtp['host'] ?? null;
    $port = (int) ($smtp['port'] ?? 465);
    $username = $smtp['username'] ?? null;
    $password = $smtp['password'] ?? null;

    $isPasswordPlaceholder = ! empty($password) && str_starts_with($password, 'your_');
    $isPasswordConfigured = ! empty($password) && ! $isPasswordPlaceholder;

    $tcpConnected = false;
    $banner = null;
    $error = null;

    if (! empty($host)) {
        $connectHost = ($port === 465) ? "ssl://{$host}" : $host;
        $socket = @fsockopen($connectHost, $port, $errno, $errstr, 3.0);
        if ($socket) {
            $tcpConnected = true;
            stream_set_timeout($socket, 3);
            $rawBanner = fgets($socket, 512);
            $banner = $rawBanner !== false ? trim($rawBanner) : null;
            fclose($socket);
        } else {
            $error = "{$errstr} ({$errno})";
        }
    }

    return response()->json([
        'mailer' => $default,
        'host' => $host,
        'port' => $port,
        'username' => $username,
        'password_configured' => $isPasswordConfigured,
        'is_placeholder_password' => $isPasswordPlaceholder,
        'from' => [
            'address' => config('mail.from.address'),
            'name' => config('mail.from.name'),
        ],
        'smtp_tcp_reachable' => $tcpConnected,
        'smtp_banner' => $banner,
        'connection_error' => $error,
        'status' => $tcpConnected
            ? ($isPasswordConfigured ? 'ready' : 'credentials_needed')
            : 'unreachable',
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

Route::prefix('v1')->middleware('api-key:read')->group(function () {
    Route::get('/workspace', [WorkspaceController::class, 'show']);
    Route::get('/members', [WorkspaceController::class, 'members']);
});
