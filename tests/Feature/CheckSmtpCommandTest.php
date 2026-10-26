<?php

namespace Tests\Feature;

it('displays the mail configuration table via mail:check command', function () {
    config([
        'mail.default' => 'smtp',
        'mail.mailers.smtp.host' => '127.0.0.1',
        'mail.mailers.smtp.port' => 2525,
        'mail.mailers.smtp.username' => 'test@example.com',
        'mail.mailers.smtp.password' => 'secret123',
        'mail.from.address' => 'system@example.com',
        'mail.from.name' => 'CrewFlow Test',
    ]);

    // Command should run, output the table, and attempt TCP check
    $this->artisan('mail:check')
        ->expectsOutputToContain('[CrewFlow Mail Diagnostics]')
        ->expectsOutputToContain('127.0.0.1');
});

it('returns mail diagnostics via /api/mail-status endpoint', function () {
    config([
        'mail.default' => 'smtp',
        'mail.mailers.smtp.host' => 'mail.example.com',
        'mail.mailers.smtp.port' => 587,
        'mail.mailers.smtp.username' => 'test@example.com',
        'mail.mailers.smtp.password' => 'secret123',
        'mail.from.address' => 'noreply@example.com',
    ]);

    $response = $this->getJson('/api/mail-status');

    $response->assertSuccessful()
        ->assertJsonStructure([
            'mailer',
            'host',
            'port',
            'username',
            'password_configured',
            'is_placeholder_password',
            'from' => ['address', 'name'],
            'smtp_tcp_reachable',
            'status',
        ]);

    expect($response->json('mailer'))->toBe('smtp');
    expect($response->json('host'))->toBe('mail.example.com');
    expect($response->json('password_configured'))->toBeTrue();
});
