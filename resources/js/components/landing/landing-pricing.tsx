import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { register } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Check, CreditCard, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';

export function LandingPricing() {
    const { auth } = usePage<SharedData>().props;
    const { t } = useTranslations();
    const [isYearly, setIsYearly] = useState(false);

    const plans = [
        {
            name: 'Starter',
            badge: 'Free Forever',
            priceMonthly: '₹0',
            priceYearly: '₹0',
            period: '/month',
            description: 'Essential work order dispatching for solo contractors and small teams.',
            highlight: false,
            features: [
                '1 Workspace',
                'Up to 3 crew members',
                '20 active work orders / month',
                'Standard safety checklists',
                'Mobile photo evidence capture',
                'Basic client address directory',
                'Help center support',
            ],
            cta: auth.user ? 'Go to Dashboard' : 'Get Started Free',
            href: auth.user ? '/dashboard' : register(),
        },
        {
            name: 'Pro',
            badge: 'Most Popular',
            priceMonthly: '₹2,499',
            priceYearly: '₹1,999',
            period: '/month',
            description: 'Complete field operations software for growing maintenance and service crews.',
            highlight: true,
            features: [
                'Up to 15 crew technicians',
                'Unlimited work orders',
                'Custom SOP & inspection checklist builder',
                'Digital customer signature capture',
                'Tamper-proof GPS timestamped evidence',
                'Automated status alerts & emails',
                'Field turnaround & SLA reports',
                'Instant Razorpay UPI & Card checkout',
                'Priority email & chat support',
            ],
            cta: auth.user ? 'Upgrade in Workspace' : 'Start 14-Day Pro Trial',
            href: auth.user ? '/billing/plans' : register(),
        },
        {
            name: 'Business',
            badge: 'For Multi-Site Operations',
            priceMonthly: '₹6,499',
            priceYearly: '₹5,199',
            period: '/month',
            description: 'Advanced controls, unlimited crew capacity, and custom integrations for scale.',
            highlight: false,
            features: [
                'Unlimited technicians & dispatchers',
                'Unlimited work orders & facilities',
                'Custom webhook automations & API access',
                'Role-based granular permissions',
                'Multi-location revenue analytics',
                'Audit log history & data export',
                'Automated GST tax receipts',
                'Dedicated account manager',
                '99.9% uptime SLA guarantee',
            ],
            cta: auth.user ? 'Upgrade to Business' : 'Start Business Trial',
            href: auth.user ? '/billing/plans' : register(),
        },
    ];

    return (
        <section id="pricing" className="py-20 sm:py-32 bg-background relative overflow-hidden">
            {/* Subtle glow */}
            <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
                <div className="h-[400px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <Badge variant="outline" className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary border-primary/30">
                        {t('landing.pricing.badge', 'Transparent Plans')}
                    </Badge>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                        Simple Pricing for{' '}
                        <span className="text-primary">High-Performing Teams</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                        {t(
                            'landing.pricing.description',
                            'Start free and scale as your field crew grows. No surprise charges. Transparent monthly and annual plans powered by Razorpay.',
                        )}
                    </p>

                    {/* Monthly / Yearly Toggle */}
                    <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border/80 bg-muted/40 p-1.5">
                        <button
                            type="button"
                            onClick={() => setIsYearly(false)}
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                                !isYearly
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Monthly Billing
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsYearly(true)}
                            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                                isYearly
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span>Annual Billing</span>
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                Save 20%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="mt-14 grid gap-8 lg:grid-cols-3 lg:items-stretch">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={`relative flex flex-col justify-between transition-all duration-200 ${
                                plan.highlight
                                    ? 'border-2 border-primary bg-card shadow-xl shadow-primary/10 -translate-y-2'
                                    : 'border-border/70 bg-card/60'
                            }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                                        <Sparkles className="h-3 w-3" />
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            <CardHeader className="pt-7">
                                {!plan.highlight && (
                                    <span className="inline-block w-fit rounded bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground mb-1">
                                        {plan.badge}
                                    </span>
                                )}
                                <CardTitle className="text-2xl font-bold text-foreground">
                                    {plan.name}
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground min-h-[36px] mt-1">
                                    {plan.description}
                                </CardDescription>

                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono">
                                        {isYearly ? plan.priceYearly : plan.priceMonthly}
                                    </span>
                                    <span className="text-sm text-muted-foreground font-medium">
                                        {plan.period}
                                    </span>
                                </div>
                                {isYearly && plan.priceYearly !== '₹0' && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                                        Billed annually (save 2 months free)
                                    </p>
                                )}
                            </CardHeader>

                            <CardContent className="flex-1 space-y-3 pt-2">
                                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    What's included:
                                </div>
                                <ul className="space-y-2.5 text-sm text-muted-foreground">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2.5">
                                            <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                                            <span className="text-foreground/90">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter className="pt-6 border-t border-border/50">
                                <Button
                                    asChild
                                    variant={plan.highlight ? 'default' : 'outline'}
                                    className={`w-full font-semibold h-11 ${
                                        plan.highlight ? 'shadow-md shadow-primary/20' : ''
                                    }`}
                                >
                                    <Link href={plan.href}>
                                        {plan.cta}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* Razorpay Integration Trust Banner */}
                <div className="mt-16 rounded-xl border border-border/70 bg-muted/30 p-6 sm:p-8">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground text-base">
                                    Instant, Secure Payments via Razorpay
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Pay effortlessly with UPI (GPay, PhonePe, Paytm), RuPay, Visa, Mastercard, and NetBanking with automated tax invoices.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <span className="rounded-md border border-border bg-background px-3 py-1.5 shadow-xs">UPI Autopay</span>
                            <span className="rounded-md border border-border bg-background px-3 py-1.5 shadow-xs">Credit & Debit Cards</span>
                            <span className="rounded-md border border-border bg-background px-3 py-1.5 shadow-xs">NetBanking</span>
                            <span className="rounded-md border border-border bg-background px-3 py-1.5 shadow-xs">GST Compliant</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
