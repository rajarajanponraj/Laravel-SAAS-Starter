<?php

use App\Models\RazorpayPayment;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->workspace = Workspace::factory()->create(['owner_id' => $this->owner->id]);
    $this->workspace->addUser($this->owner, 'owner');
    $this->owner->switchWorkspace($this->workspace);
});

describe('Razorpay Order Creation', function () {
    it('creates a razorpay order for workspace owner', function () {
        config([
            'billing.razorpay.key_id' => 'rzp_test_key123',
            'billing.razorpay.key_secret' => 'rzp_secret_xyz456',
            'billing.razorpay.currency' => 'INR',
        ]);

        Http::fake([
            'https://api.razorpay.com/v1/orders' => Http::response([
                'id' => 'order_live_123456',
                'amount' => 249900,
                'currency' => 'INR',
                'status' => 'created',
            ], 200),
        ]);

        $response = $this->actingAs($this->owner)
            ->postJson('/billing/razorpay/order', [
                'plan' => 'pro',
                'billing_period' => 'monthly',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('order.order_id', 'order_live_123456')
            ->assertJsonPath('order.amount', 249900)
            ->assertJsonPath('order.currency', 'INR');

        $this->assertDatabaseHas('razorpay_payments', [
            'workspace_id' => $this->workspace->id,
            'order_id' => 'order_live_123456',
            'plan' => 'pro',
            'billing_period' => 'monthly',
            'status' => 'created',
        ]);
    });

    it('requires owner or billing manager to create razorpay order', function () {
        $member = User::factory()->create();
        $this->workspace->addUser($member, 'member');
        $member->switchWorkspace($this->workspace);

        $this->actingAs($member)
            ->postJson('/billing/razorpay/order', [
                'plan' => 'pro',
                'billing_period' => 'monthly',
            ])
            ->assertForbidden();
    });

    it('validates plan and billing period', function () {
        $this->actingAs($this->owner)
            ->postJson('/billing/razorpay/order', [
                'plan' => 'invalid',
                'billing_period' => 'daily',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['plan', 'billing_period']);
    });
});

describe('Razorpay Payment Verification & Plan Activation', function () {
    it('verifies signature and upgrades workspace to Pro plan', function () {
        $keySecret = 'rzp_secret_xyz456';
        config([
            'billing.razorpay.key_id' => 'rzp_test_key123',
            'billing.razorpay.key_secret' => $keySecret,
        ]);

        $payment = RazorpayPayment::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->owner->id,
            'order_id' => 'order_valid_789',
            'plan' => 'pro',
            'billing_period' => 'monthly',
            'amount' => 249900,
            'currency' => 'INR',
            'status' => 'created',
        ]);

        $paymentId = 'pay_test_999888';
        $validSignature = hash_hmac('sha256', $payment->order_id.'|'.$paymentId, $keySecret);

        $response = $this->actingAs($this->owner)
            ->postJson('/billing/razorpay/verify', [
                'razorpay_order_id' => $payment->order_id,
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature' => $validSignature,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        expect($this->workspace->fresh()->plan_name)->toBe('Pro')
            ->and($this->workspace->fresh()->billing_gateway)->toBe('razorpay')
            ->and($this->workspace->fresh()->billing_period)->toBe('monthly')
            ->and($this->workspace->fresh()->onProPlan())->toBeTrue();

        $this->assertDatabaseHas('razorpay_payments', [
            'id' => $payment->id,
            'payment_id' => $paymentId,
            'status' => 'captured',
        ]);
    });

    it('rejects verification if signature is invalid', function () {
        $keySecret = 'rzp_secret_xyz456';
        config([
            'billing.razorpay.key_id' => 'rzp_test_key123',
            'billing.razorpay.key_secret' => $keySecret,
        ]);

        $payment = RazorpayPayment::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->owner->id,
            'order_id' => 'order_fraud_111',
            'plan' => 'business',
            'billing_period' => 'yearly',
            'amount' => 6499000,
            'currency' => 'INR',
            'status' => 'created',
        ]);

        $response = $this->actingAs($this->owner)
            ->postJson('/billing/razorpay/verify', [
                'razorpay_order_id' => $payment->order_id,
                'razorpay_payment_id' => 'pay_tampered_123',
                'razorpay_signature' => 'invalid_tampered_signature',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        expect($this->workspace->fresh()->plan_name)->toBe('Free')
            ->and($payment->fresh()->status)->toBe('failed');
    });
});

describe('Razorpay Webhooks', function () {
    it('processes order.paid webhook and updates workspace', function () {
        $webhookSecret = 'whsec_secret_456';
        config([
            'billing.razorpay.webhook_secret' => $webhookSecret,
        ]);

        $payment = RazorpayPayment::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->owner->id,
            'order_id' => 'order_webhook_001',
            'plan' => 'business',
            'billing_period' => 'yearly',
            'amount' => 6499000,
            'currency' => 'INR',
            'status' => 'created',
        ]);

        $payload = [
            'event' => 'payment.captured',
            'payload' => [
                'payment' => [
                    'entity' => [
                        'id' => 'pay_webhook_999',
                        'order_id' => 'order_webhook_001',
                        'status' => 'captured',
                    ],
                ],
            ],
        ];

        $content = json_encode($payload);
        $signature = hash_hmac('sha256', $content, $webhookSecret);

        $response = $this->call(
            'POST',
            '/razorpay/webhook',
            [],
            [],
            [],
            ['HTTP_X-Razorpay-Signature' => $signature, 'CONTENT_TYPE' => 'application/json'],
            $content
        );

        $response->assertOk()
            ->assertJsonPath('status', 'success');

        expect($this->workspace->fresh()->plan_name)->toBe('Business')
            ->and($payment->fresh()->status)->toBe('captured');
    });

    it('rejects webhook with invalid signature', function () {
        config([
            'billing.razorpay.webhook_secret' => 'whsec_secret_456',
        ]);

        $content = json_encode(['event' => 'payment.captured']);

        $response = $this->call(
            'POST',
            '/razorpay/webhook',
            [],
            [],
            [],
            ['HTTP_X-Razorpay-Signature' => 'invalid_signature', 'CONTENT_TYPE' => 'application/json'],
            $content
        );

        $response->assertStatus(400)
            ->assertJsonPath('status', 'invalid_signature');
    });
});
