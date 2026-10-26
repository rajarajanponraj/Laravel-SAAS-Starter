<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class CheckSmtpCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:check 
                            {recipient? : Optional recipient email to send a test message to}
                            {--send : Send an actual test email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check SMTP connectivity, verify server handshake, and optionally send a test email.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $defaultMailer = config('mail.default', 'log');
        $smtpConfig = config("mail.mailers.{$defaultMailer}", []);
        $host = $smtpConfig['host'] ?? null;
        $port = $smtpConfig['port'] ?? 465;
        $username = $smtpConfig['username'] ?? null;
        $password = $smtpConfig['password'] ?? null;
        $fromAddress = config('mail.from.address', 'noreply@example.com');
        $fromName = config('mail.from.name', config('app.name', 'Laravel'));

        $this->info('==> [CrewFlow Mail Diagnostics]');
        $this->table(
            ['Configuration Key', 'Value'],
            [
                ['Default Mailer', $defaultMailer],
                ['SMTP Host', $host ?: '(not configured)'],
                ['SMTP Port', (string) $port],
                ['SMTP Username', $username ?: '(empty)'],
                ['SMTP Password', ! empty($password) ? (str_starts_with($password, 'your_') ? '[PLACEHOLDER: '.$password.']' : '******** (configured)') : '(empty)'],
                ['From Address', $fromAddress],
                ['From Name', $fromName],
            ]
        );

        if ($defaultMailer !== 'smtp' && $defaultMailer !== 'sendmail') {
            $this->warn("Current mailer is set to '{$defaultMailer}'. SMTP checks apply when MAIL_MAILER=smtp.");
        }

        if (empty($host)) {
            $this->error('SMTP Host is not defined in mail configuration.');

            return self::FAILURE;
        }

        // 1. Check TCP Connectivity & SMTP Banner (with SSL wrapper if port 465)
        $isSsl = (int) $port === 465;
        $connectHost = $isSsl ? "ssl://{$host}" : $host;
        $this->info("==> Testing connectivity to {$host}:{$port}".($isSsl ? ' (SSL)' : '').'...');
        $socket = @fsockopen($connectHost, (int) $port, $errno, $errstr, 5.0);

        if (! $socket) {
            $this->error("Connection failed: {$errstr} (error code: {$errno})");
            $this->line("Please verify that port {$port} is open and {$host} resolves correctly.");

            return self::FAILURE;
        }

        $this->info("   [SUCCESS] TCP socket connected to {$host}:{$port}!");

        // 2. Read SMTP Initial Banner
        stream_set_timeout($socket, 5);
        $banner = fgets($socket, 512);
        if ($banner !== false) {
            $this->line('   [BANNER] '.trim($banner));
        }

        // 3. Test EHLO handshake
        fwrite($socket, "EHLO crm.bytebunkers.sbs\r\n");
        $ehloResponse = fgets($socket, 512);
        if ($ehloResponse !== false) {
            $this->line('   [EHLO Response] '.trim($ehloResponse));
        }
        fwrite($socket, "QUIT\r\n");
        fclose($socket);

        // 4. Send test email if requested
        $recipient = $this->argument('recipient');
        $shouldSend = $this->option('send') || ! empty($recipient);

        if ($shouldSend) {
            $to = $recipient ?: $fromAddress;
            $this->info("==> Sending test email to {$to} via '{$defaultMailer}' transport...");

            try {
                Mail::raw("Hello,\n\nThis is a verification email from CrewFlow confirming your SMTP email transport is functioning correctly.\n\nTimestamp: ".now()->toIso8601String(), function ($message) use ($to, $fromAddress, $fromName): void {
                    $message->to($to)
                        ->from($fromAddress, $fromName)
                        ->subject('CrewFlow SMTP Verification Test - '.now()->format('Y-m-d H:i:s'));
                });

                $this->info("   [SUCCESS] Test email successfully sent to {$to}!");
            } catch (Throwable $e) {
                $this->error('   [FAILED] Failed to send email: '.$e->getMessage());

                return self::FAILURE;
            }
        } else {
            $this->line("\nTo send an actual verification email, run:");
            $this->comment('   php artisan mail:check your-email@example.com --send');
        }

        return self::SUCCESS;
    }
}
