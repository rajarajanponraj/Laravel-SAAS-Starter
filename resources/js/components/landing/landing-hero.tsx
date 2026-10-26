import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { register } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Camera,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    Clock,
    FileCheck2,
    HardHat,
    MapPin,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';

export function LandingHero() {
    const { auth } = usePage<SharedData>().props;
    const { t } = useTranslations();

    const stats = [
        {
            icon: ClipboardCheck,
            value: '50,000+',
            label: t('landing.hero.stats.work_orders', 'Work Orders Dispatched'),
        },
        {
            icon: Users,
            value: '1,200+',
            label: t('landing.hero.stats.crews', 'Field Techs & Crews'),
        },
        {
            icon: Zap,
            value: '99.4%',
            label: t('landing.hero.stats.sla', 'On-Time SLA Completion'),
        },
    ];

    const highlights = [
        t('landing.hero.features.dispatch', 'Smart Work Order Dispatching'),
        t('landing.hero.features.mobile', 'Mobile Field Tech Portal'),
        t('landing.hero.features.checklists', 'Digital Inspection SOPs'),
        t('landing.hero.features.evidence', 'Photo & Signature Evidence'),
        t('landing.hero.features.razorpay', 'Instant Razorpay Billing'),
        t('landing.hero.features.automations', 'Automated Client Alerts'),
    ];

    return (
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32 lg:pt-24 lg:pb-36">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
                <div className="h-[480px] w-[640px] rounded-full bg-primary/10 blur-[130px] dark:bg-primary/15" />
                <div className="absolute top-1/4 right-1/4 h-[320px] w-[420px] rounded-full bg-amber-500/10 blur-[120px]" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header Text Block */}
                <div className="mx-auto max-w-3xl text-center">
                    {/* Live Product Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>{t('landing.hero.badge', 'Next-Gen Field Service & Work Order CRM')}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                        <span>Dispatch Work Orders.</span>{' '}
                        <span className="bg-gradient-to-r from-primary via-indigo-500 to-amber-500 bg-clip-text text-transparent">
                            Empower Field Crews.
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                        {t(
                            'landing.hero.description',
                            'The complete operations platform for contractors, maintenance teams, and service providers. Schedule jobs, track mobile technicians, capture verified proof of work, and collect payments effortlessly.',
                        )}
                    </p>

                    {/* Call to Action Buttons */}
                    <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button
                            size="lg"
                            asChild
                            className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                        >
                            <Link href={auth.user ? '/dashboard' : register()}>
                                {auth.user
                                    ? t('landing.hero.launch_dashboard', 'Open Workspace')
                                    : t('landing.hero.start_free', 'Start Free Trial')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                            className="h-12 border-border/80 px-8 text-base font-medium hover:bg-muted/60"
                        >
                            <a href="#features">
                                <HardHat className="mr-2 h-4 w-4 text-amber-500" />
                                {t('landing.hero.see_how_it_works', 'Explore Solutions')}
                            </a>
                        </Button>
                    </div>

                    {/* Micro trust indicators */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            No credit card required
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Razorpay UPI & Cards ready
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Mobile technician portal
                        </span>
                    </div>
                </div>

                {/* Hero Showcase Mockup: Live Work Order Operations UI */}
                <div className="relative mt-14 sm:mt-20">
                    <div className="relative mx-auto max-w-5xl rounded-2xl border border-border/60 bg-card/70 p-3 shadow-2xl backdrop-blur-xl sm:p-5">
                        {/* Browser Window Header */}
                        <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                                <span className="ml-2 text-xs font-mono text-muted-foreground">
                                    https://crm.bytebunkers.sbs/work-orders/WO-8492
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Dispatch Board
                                </span>
                            </div>
                        </div>

                        {/* Mock Work Order Card Grid */}
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Main Active Ticket Details */}
                            <div className="space-y-4 rounded-xl border border-border/70 bg-background/80 p-5 md:col-span-2 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-primary">#WO-8492</span>
                                            <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 text-[11px]">
                                                High Priority
                                            </Badge>
                                            <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[11px]">
                                                In Progress
                                            </Badge>
                                        </div>
                                        <h3 className="mt-1.5 text-lg font-bold text-foreground">
                                            Commercial HVAC Chiller Compressor Overhaul
                                        </h3>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>Apex Global Tower • 54 Harbor St, Floor 14 Mechanical Room</span>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-right">
                                        <div className="text-[11px] text-muted-foreground">Service Timer</div>
                                        <div className="flex items-center gap-1 font-mono text-sm font-bold text-foreground">
                                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                                            01h 48m 22s
                                        </div>
                                    </div>
                                </div>

                                {/* Field Checklist Preview */}
                                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3.5">
                                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                                        <span>Inspection & Safety Checklist</span>
                                        <span className="text-emerald-500">4 of 5 Completed (80%)</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div className="h-full w-4/5 rounded-full bg-emerald-500 transition-all" />
                                    </div>
                                    <div className="grid gap-1.5 pt-1 text-xs">
                                        <div className="flex items-center gap-2 text-foreground font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                            <span>Lockout/Tagout protocol confirmed on Main Panel C</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-foreground font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                            <span>Refrigerant leak pressure differential verified (42.5 PSI)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-foreground font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                            <span>Motor stator assembly replacement complete</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-foreground font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                            <span>Before & after high-resolution photo evidence attached (3 files)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40" />
                                            <span>Client facility manager digital sign-off</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Technician & Evidence Badges */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400">
                                            MV
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-foreground">Marcus Vance</div>
                                            <div className="text-[11px] text-muted-foreground">Lead Field Technician • GPS Verified</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                                            <Camera className="h-3 w-3" /> 3 Photos
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                                            <ShieldCheck className="h-3 w-3 text-emerald-500" /> Tamper-Proof
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Mock: Quick Stats & Dispatch Feed */}
                            <div className="space-y-3 rounded-xl border border-border/70 bg-background/80 p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                        Crew Dispatch Feed
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">Today</Badge>
                                </div>

                                <div className="space-y-3 pt-1">
                                    <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-foreground">WO-8490 Completed</span>
                                            <span className="text-[10px] text-muted-foreground">12m ago</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Elec. Breaker Diagnostics • St. Jude Hospital
                                        </p>
                                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                            <span>✓ Client Signed</span>
                                            <span>₹14,500 Invoiced</span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-foreground">WO-8491 Dispatched</span>
                                            <span className="text-[10px] text-muted-foreground">34m ago</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Fire Alarm Annual Inspection • Nexus Mall
                                        </p>
                                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-blue-500 font-medium">
                                            <UserCheck className="h-3 w-3" /> Tech En Route (ETA 8 mins)
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-foreground">Razorpay Auto-Payout</span>
                                            <span className="text-[10px] text-emerald-500 font-bold">Captured</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-[11px]">
                                            <span className="text-muted-foreground">Pro Plan Subscription</span>
                                            <span className="font-semibold font-mono text-foreground">₹2,499.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stat Counters Banner */}
                <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:gap-8">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-sm"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-extrabold tracking-tight text-foreground">
                                    {stat.value}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Key Capabilities Badges */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5">
                    {highlights.map((f) => (
                        <div
                            key={f}
                            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted/70"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            <span>{f}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
