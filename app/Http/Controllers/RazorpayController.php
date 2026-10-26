<?php

namespace App\Http\Controllers;

use App\Models\RazorpayPayment;
use App\Services\RazorpayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class RazorpayController extends Controller
{
    public function __construct(
        protected RazorpayService $razorpayService
    ) {}

    /**
     * Create a Razorpay order for subscribing to a plan.
     */
    public function createOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan' => ['required', 'string', 'in:pro,business'],
            'billing_period' => ['required', 'string', 'in:monthly,yearly'],
        ]);

        $user = $request->user();
        $workspace = $user->currentWorkspace;
        Gate::authorize('manageBilling', $workspace);

        try {
            $orderData = $this->razorpayService->createOrder(
                $workspace,
                $validated['plan'],
                $validated['billing_period'],
                $user
            );

            return response()->json([
                'success' => true,
                'order' => $orderData,
            ]);
        } catch (\Exception $e) {
            Log::error('Razorpay Create Order Error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Verify payment signature from Razorpay checkout modal.
     */
    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'razorpay_order_id' => ['required', 'string'],
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_signature' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $workspace = $user->currentWorkspace;
        Gate::authorize('manageBilling', $workspace);

        try {
            $result = $this->razorpayService->verifyPayment($workspace, $validated, $user);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Razorpay Verify Error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Handle incoming webhooks from Razorpay.
     */
    public function webhook(Request $request): JsonResponse
    {
        $signature = $request->header('X-Razorpay-Signature');
        $content = $request->getContent();

        if (! $this->razorpayService->verifyWebhookSignature($content, $signature)) {
            Log::warning('Razorpay Webhook: Invalid Signature');

            return response()->json(['status' => 'invalid_signature'], 400);
        }

        $payload = $request->all();
        $event = $payload['event'] ?? null;

        Log::info('Razorpay Webhook Received', ['event' => $event]);

        if (in_array($event, ['payment.captured', 'order.paid'], true)) {
            $entity = $payload['payload']['payment']['entity'] ?? $payload['payload']['order']['entity'] ?? [];
            $orderId = $entity['order_id'] ?? $entity['id'] ?? null;
            $paymentId = $entity['id'] ?? null;

            if ($orderId) {
                $payment = RazorpayPayment::where('order_id', $orderId)->first();
                if ($payment && $payment->status !== 'captured') {
                    $payment->update([
                        'payment_id' => $paymentId ?? $payment->payment_id,
                        'status' => 'captured',
                    ]);

                    $workspace = $payment->workspace;
                    if ($workspace) {
                        $workspace->update([
                            'plan_override' => $payment->plan,
                            'billing_gateway' => 'razorpay',
                            'billing_period' => $payment->billing_period,
                            'plan_expires_at' => $payment->billing_period === 'yearly'
                                ? now()->addYear()
                                : now()->addMonth(),
                        ]);
                        $workspace->clearResolvedPlan();
                    }
                }
            }
        }

        return response()->json(['status' => 'success']);
    }
}
