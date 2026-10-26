import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { register } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, HardHat, Sparkles } from 'lucide-react';

export function LandingCta() {
    const { auth } = usePage<SharedData>().props;
    const { t } = useTranslations();

    return (
        <section className="py-16 sm:py-24 relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-12 sm:px-12 sm:py-16 lg:px-16 text-center text-white shadow-2xl">
                    {/* Decorative Background Lighting */}
                    <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/25 blur-3xl" />

                    <div className="relative mx-auto max-w-3xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-xs">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            <span>{t('landing.cta.badge', 'Zero Clutter • Maximum Field Output')}</span>
                        </div>

                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-tight">
                            Ready to Modernize Your Field Operations?
                        </h2>

                        <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
                            {t(
                                'landing.cta.description',
                                'Join trade contractors, maintenance crews, and facility supervisors dispatching thousands of jobs with tamper-proof photo verification, mobile checklists, and instant Razorpay billing.',
                            )}
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Button
                                size="lg"
                                asChild
                                className="h-12 bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
                            >
                                <Link href={auth.user ? '/dashboard' : register()}>
                                    {auth.user
                                        ? t('landing.cta.go_to_dashboard', 'Open Workspace')
                                        : t('landing.cta.get_started', 'Start Free Trial')}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                asChild
                                className="h-12 border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/15 hover:text-white"
                            >
                                <a href="#pricing">
                                    {t('landing.cta.view_plans', 'View Subscription Plans')}
                                </a>
                            </Button>
                        </div>

                        {/* Micro trust indicators */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/60">
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                Free 14-day trial
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                No credit card needed to test
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                Instant Razorpay activation
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
