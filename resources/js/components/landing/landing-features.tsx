import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import {
    ArrowRight,
    Building2,
    Camera,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    FileSpreadsheet,
    HardHat,
    ListChecks,
    MapPin,
    ShieldCheck,
    Smartphone,
    UserCheck,
    Zap,
} from 'lucide-react';

export function LandingFeatures() {
    const { t } = useTranslations();

    const mainFeatures = [
        {
            icon: ClipboardList,
            title: t('landing.features.dispatch.title', 'Smart Work Order Dispatching'),
            description: t(
                'landing.features.dispatch.desc',
                'Create, schedule, and assign maintenance and service tickets in seconds. Filter by priority, equipment type, and technician skill sets with live status tracking.',
            ),
            badge: 'Core Workflow',
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
        },
        {
            icon: HardHat,
            title: t('landing.features.worker.title', 'Mobile Field Tech Portal ("My Jobs")'),
            description: t(
                'landing.features.worker.desc',
                'A lightweight, mobile-first experience built for field staff. Technicians view their daily queue, map service routes, and record job progress without cluttered menus.',
            ),
            badge: 'Mobile First',
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
        },
        {
            icon: ListChecks,
            title: t('landing.features.checklists.title', 'Digital SOPs & Safety Checklists'),
            description: t(
                'landing.features.checklists.desc',
                'Enforce safety compliance and quality standards. Require technicians to step through mandatory checklists before marking jobs complete.',
            ),
            badge: 'Zero Errors',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
        },
        {
            icon: ShieldCheck,
            title: t('landing.features.evidence.title', 'Verified Photo & Signature Evidence'),
            description: t(
                'landing.features.evidence.desc',
                'Eliminate invoice disputes forever. Capture timestamped before/after photos and on-screen customer signature sign-offs recorded directly on the work order.',
            ),
            badge: 'Audit Ready',
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
        },
        {
            icon: Building2,
            title: t('landing.features.customers.title', 'Customer & Multi-Site Directory'),
            description: t(
                'landing.features.customers.desc',
                'Centralize client accounts, branch facility locations, equipment models, past service logs, and site contact coordinates in one searchable hub.',
            ),
            badge: '360° Visibility',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-500/10',
            borderColor: 'border-indigo-500/20',
        },
        {
            icon: Zap,
            title: t('landing.features.automations.title', 'Automated Event Triggers & Alerts'),
            description: t(
                'landing.features.automations.desc',
                'Set up rules that trigger instantly: send automated customer emails when work orders are scheduled, notify dispatchers of SLA breaches, and generate job reports.',
            ),
            badge: 'Hands Free',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-500/20',
        },
        {
            icon: FileSpreadsheet,
            title: t('landing.features.reports.title', 'Field Turnaround & Revenue Analytics'),
            description: t(
                'landing.features.reports.desc',
                'Monitor team efficiency, average resolution time, work order completion volume, and revenue per customer with exportable Excel and PDF reports.',
            ),
            badge: 'Real-Time Insights',
            color: 'text-cyan-500',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/20',
        },
        {
            icon: CreditCard,
            title: t('landing.features.billing.title', 'Instant Razorpay UPI & Card Billing'),
            description: t(
                'landing.features.billing.desc',
                'Integrated with India’s leading payment gateway. Subscribe to Pro or Business tiers seamlessly using Google Pay, PhonePe, Paytm, Cards, and NetBanking.',
            ),
            badge: 'Seamless Payments',
            color: 'text-teal-500',
            bgColor: 'bg-teal-500/10',
            borderColor: 'border-teal-500/20',
        },
    ];

    return (
        <section id="features" className="py-20 sm:py-28 bg-muted/20 relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <Badge variant="outline" className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary border-primary/30">
                        {t('landing.features.badge', 'Built For Modern Operations')}
                    </Badge>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                        Everything You Need to Run{' '}
                        <span className="text-primary">Flawless Field Service</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                        {t(
                            'landing.features.subtitle',
                            'Replace disconnected spreadsheets, paper clipboards, and WhatsApp threads with a unified CRM platform purpose-built for trade and field service operations.',
                        )}
                    </p>
                </div>

                {/* Features Bento / Grid */}
                <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {mainFeatures.map((feature) => (
                        <Card
                            key={feature.title}
                            className={`group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border-border/70 bg-card/80 backdrop-blur-sm ${feature.borderColor}`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-lg ${feature.bgColor} ${feature.color}`}
                                    >
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                        {feature.badge}
                                    </span>
                                </div>
                                <CardTitle className="mt-4 text-lg font-bold text-foreground">
                                    {feature.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Interactive Workflow Highlight (How It Works) */}
                <div id="solutions" className="mt-20 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background p-6 sm:p-10 shadow-sm">
                    <div className="mx-auto max-w-2xl text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            Field Execution Lifecycle
                        </span>
                        <h3 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                            How CrewFlow Streamlines Every Work Order
                        </h3>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="relative space-y-3 rounded-xl border border-border/60 bg-muted/30 p-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                                1
                            </div>
                            <h4 className="text-lg font-bold text-foreground">Dispatch & Route</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Office dispatcher logs customer request, selects service location, attaches the correct SOP checklist, and assigns the job to an available technician.
                            </p>
                        </div>

                        <div className="relative space-y-3 rounded-xl border border-border/60 bg-muted/30 p-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 font-bold text-white">
                                2
                            </div>
                            <h4 className="text-lg font-bold text-foreground">Field Execution</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Technician gets instant notification on mobile, navigates to the site, checks off inspection items, snaps before/after photos, and logs actual hours.
                            </p>
                        </div>

                        <div className="relative space-y-3 rounded-xl border border-border/60 bg-muted/30 p-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 font-bold text-white">
                                3
                            </div>
                            <h4 className="text-lg font-bold text-foreground">Sign-Off & Invoice</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Customer inspects the work and signs on the technician's mobile screen. An automated completion report with photos is instantly emailed to the client.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
