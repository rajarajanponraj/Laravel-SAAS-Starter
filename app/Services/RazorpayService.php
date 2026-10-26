<?php

namespace App\Services;

use App\Models\RazorpayPayment;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class RazorpayService
{
    protected ?string $keyId;

    protected ?string $keySecret;

    protected ?string $webhookSecret;

    protected string $currency;

    public function __construct()
    {
        $this->keyId = config('billing.razorpay.key_id') ?: config('services.razorpay.key');
        $this->keySecret = config('billing.razorpay.key_secret') ?: config('services.razorpay.secret');
        $this->webhookSecret = config('billing.razorpay.webhook_secret') ?: config('services.razorpay.webhook_secret');
        $this->currency = strtoupper(config('billing.razorpay.currency') ?: 'INR');
    }

    /**
     * Check if Razorpay API keys are configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->keyId) && ! empty($this->keySecret);
    }

    /**
     * Get the public Razorpay Key ID for frontend Checkout.js.
     */
    public function getKeyId(): ?string
    {
        return $this->keyId;
    }

    /**
     * Get the configured currency.
     */
    public function getCurrency(): string
    {
        return $this->currency;
    }

    /**
     * Calculate price in major currency units and smallest subunits (e.g. paise).
     *
     * @return array{amount: int, amount_subunits: int, currency: string}
     */
    public function calculateAmount(string $planKey, string $billingPeriod): array
    {
        $plans = config('billing.plans', []);
        $plan = $plans[$planKey] ?? null;

        if (! $plan) {
            throw ValidationException::withMessages(['plan' => 'Invalid subscription plan selected.']);
        }

        // Check if currency is INR
        if ($this->currency === 'INR') {
            $inrPrices = [
                'pro' => [
                    'monthly' => (int) env('RAZORPAY_PRO_MONTHLY_PRICE', 2499),
                    'yearly' => (int) env('RAZORPAY_PRO_YEARLY_PRICE', 24990),
                ],
                'business' => [
                    'monthly' => (int) env('RAZORPAY_BUSINESS_MONTHLY_PRICE', 6499),
                    'yearly' => (int) env('RAZORPAY_BUSINESS_YEARLY_PRICE', 64990),
                ],
            ];

            $amount = $inrPrices[$planKey][$billingPeriod] ?? 2499;
        } else {
            // Default USD price from plan config
            $amount = $plan['price'][$billingPeriod] ?? 29;
        }

        return [
            'amount' => $amount,
            'amount_subunits' => $amount * 100, // Razorpay requires paise / cents
            'currency' => $this->currency,
        ];
    }

    /**
     * Create a Razorpay Order for a workspace subscription.
     *
     * @return array<string, mixed>
     */
    public function createOrder(Workspace $workspace, string $planKey, string $billingPeriod, User $user): array
    {
        $priceData = $this->calculateAmount($planKey, $billingPeriod);
        $amountSubunits = $priceData['amount_subunits'];
        $receipt = 'ws_'.$workspace->id.'_'.$planKey.'_'.substr(uniqid(), -6);

        $orderId = null;

        if ($this->isConfigured()) {
            $response = Http::withBasicAuth($this->keyId, $this->keySecret)
                ->timeout(10)
                ->post('https://api.razorpay.com/v1/orders', [
                    'amount' => $amountSubunits,
                    'currency' => $this->currency,
                    'receipt' => $receipt,
                    'notes' => [
                        'workspace_id' => (string) $workspace->id,
                        'workspace_name' => $workspace->name,
                        'user_id' => (string) $user->id,
                        'user_email' => $user->email,
                        'plan' => $planKey,
                        'billing_period' => $billingPeriod,
                    ],
                ]);

            if (! $response->successful()) {
                Log::error('Razorpay Order Creation Failed', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);
                throw new \RuntimeException('Failed to create Razorpay payment order: '.($response->json('error.description') ?? 'Gateway error'));
            }

            $orderId = $response->json('id');
        } else {
            // Sandbox/Mock Order for development/preview when keys not yet entered
            $orderId = 'order_test_'.uniqid();
        }

        // Store payment order record in database
        $payment = RazorpayPayment::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'order_id' => $orderId,
            'plan' => $planKey,
            'billing_period' => $billingPeriod,
            'amount' => $amountSubunits,
            'currency' => $this->currency,
            'status' => 'created',
            'receipt' => $receipt,
            'notes' => [
                'plan_name' => ucfirst($planKey),
                'user_name' => $user->name,
            ],
        ]);

        return [
            'order_id' => $orderId,
            'payment_record_id' => $payment->id,
            'key' => $this->keyId ?: 'rzp_test_placeholder',
            'amount' => $amountSubunits,
            'currency' => $this->currency,
            'name' => config('app.name', 'CrewFlow'),
            'description' => ucfirst($planKey).' Plan ('.ucfirst($billingPeriod).')',
            'prefill' => [
                'name' => $user->name,
                'email' => $user->email,
                'contact' => '',
            ],
            'theme' => [
                'color' => config('billing.razorpay.theme_color', '#0f172a'),
            ],
            'is_sandbox' => ! $this->isConfigured(),
        ];
    }

    /**
     * Verify payment signature and activate workspace plan.
     *
     * @param  array{razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature?: string}  $payload
     * @return array{success: bool, message: string}
     */
    public function verifyPayment(Workspace $workspace, array $payload, User $user): array
    {
        $orderId = $payload['razorpay_order_id'];
        $paymentId = $payload['razorpay_payment_id'];
        $signature = $payload['razorpay_signature'] ?? '';

        $payment = RazorpayPayment::where('order_id', $orderId)
            ->where('workspace_id', $workspace->id)
            ->first();

        if (! $payment) {
            throw ValidationException::withMessages(['order' => 'Payment order not found for this workspace.']);
        }

        // Verify cryptographic signature if keys configured
        if ($this->isConfigured()) {
            $expectedSignature = hash_hmac('sha256', $orderId.'|'.$paymentId, $this->keySecret);
            if (! hash_equals($expectedSignature, $signature)) {
                $payment->update(['status' => 'failed']);
                throw ValidationException::withMessages(['signature' => 'Payment signature verification failed.']);
            }
        } elseif (! str_starts_with($orderId, 'order_test_')) {
            throw ValidationException::withMessages(['order' => 'Invalid order identifier.']);
        }

        // Update payment record to captured/paid
        $payment->update([
            'payment_id' => $paymentId,
            'signature' => $signature,
            'status' => 'captured',
        ]);

        // Activate workspace plan
        $planExpiresAt = $payment->billing_period === 'yearly'
            ? now()->addYear()
            : now()->addMonth();

        $workspace->update([
            'plan_override' => $payment->plan,
            'billing_gateway' => 'razorpay',
            'billing_period' => $payment->billing_period,
            'plan_expires_at' => $planExpiresAt,
        ]);

        // Clear cached resolved plan
        $workspace->clearResolvedPlan();

        activity()
            ->performedOn($workspace)
            ->causedBy($user)
            ->withProperties([
                'gateway' => 'razorpay',
                'plan' => $payment->plan,
                'period' => $payment->billing_period,
                'amount' => $payment->amount / 100,
                'currency' => $payment->currency,
                'payment_id' => $paymentId,
                'order_id' => $orderId,
            ])
            ->log("Workspace upgraded to {$payment->plan} plan via Razorpay");

        return [
            'success' => true,
            'message' => 'Payment verified successfully! Welcome to the '.ucfirst($payment->plan).' plan.',
        ];
    }

    /**
     * Verify incoming webhook signature.
     */
    public function verifyWebhookSignature(string $content, ?string $signature): bool
    {
        if (empty($this->webhookSecret) || empty($signature)) {
            return false;
        }

        $expected = hash_hmac('sha256', $content, $this->webhookSecret);

        return hash_equals($expected, $signature);
    }
}
