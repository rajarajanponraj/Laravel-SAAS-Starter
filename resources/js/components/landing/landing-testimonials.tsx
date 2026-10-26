import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Quote, Star } from 'lucide-react';

export function LandingTestimonials() {
    const { t } = useTranslations();

    const testimonials = [
        {
            quote: t(
                'landing.testimonials.items.rajesh.quote',
                'CrewFlow completely transformed how we dispatch 35 technicians across 200+ commercial facilities. Billing disputes dropped to zero because every completed work order includes geo-stamped photos and client signatures.',
            ),
            author: 'Rajesh Nair',
            role: t('landing.testimonials.items.rajesh.role', 'Operations Director, Vertex Facility Management'),
            initials: 'RN',
            rating: 5,
            tag: 'Commercial Facilities',
        },
        {
            quote: t(
                'landing.testimonials.items.marcus.quote',
                'Our field technicians actually love using the "My Jobs" mobile portal. They do not have to carry clipboards or dial dispatch for job details. Our turnaround time dropped from 3.5 hours to 58 minutes.',
            ),
            author: 'Marcus Vance',
            role: t('landing.testimonials.items.marcus.role', 'VP of Field Operations, Apex HVAC & Mechanical'),
            initials: 'MV',
            rating: 5,
            tag: 'HVAC & Mechanical',
        },
        {
            quote: t(
                'landing.testimonials.items.ananya.quote',
                'The Razorpay UPI integration and automated completion certificates make billing instantaneous. The checklist templates guarantee our safety SOPs and lockout/tagout protocols are executed with 100% compliance.',
            ),
            author: 'Ananya Sharma',
            role: t('landing.testimonials.items.ananya.role', 'Managing Director, ElectraCore Industrial Solutions'),
            initials: 'AS',
            rating: 5,
            tag: 'Electrical & Industrial',
        },
    ];

    const stats = [
        {
            value: '50,000+',
            label: t('landing.testimonials.stats.orders', 'Work Orders Executed'),
        },
        {
            value: '3.4x',
            label: t('landing.testimonials.stats.speed', 'Faster Dispatch Speed'),
        },
        {
            value: '99.8%',
            label: t('landing.testimonials.stats.compliance', 'Checklist SOP Compliance'),
        },
        {
            value: '₹0',
            label: t('landing.testimonials.stats.disputes', 'Unverified Invoice Disputes'),
        },
    ];

    return (
        <section id="testimonials" className="py-20 sm:py-32 bg-muted/20 relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <Badge variant="outline" className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary border-primary/30">
                        {t('landing.testimonials.badge', 'Proven Results')}
                    </Badge>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                        Trusted by Leading{' '}
                        <span className="text-primary">Service Crews & Contractors</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                        {t(
                            'landing.testimonials.description',
                            'See how facility managers, maintenance supervisors, and trade specialists run more profitable field operations with CrewFlow.',
                        )}
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="mt-14 grid gap-8 md:grid-cols-3">
                    {testimonials.map((testimonial) => (
                        <Card
                            key={testimonial.author}
                            className="flex flex-col justify-between border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
                        >
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex gap-0.5 text-amber-500">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className="h-4 w-4 fill-amber-500"
                                            />
                                        ))}
                                    </div>
                                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                        {testimonial.tag}
                                    </span>
                                </div>
                                <Quote className="h-6 w-6 text-primary/30 mb-2" />
                                <p className="text-sm text-foreground/90 leading-relaxed italic">
                                    "{testimonial.quote}"
                                </p>
                            </CardContent>

                            <div className="mt-6 flex items-center gap-3 border-t border-border/50 pt-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {testimonial.initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-sm text-foreground truncate">
                                        {testimonial.author}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {testimonial.role}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* KPI Bar */}
                <div className="mt-16 grid grid-cols-2 gap-4 rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm md:grid-cols-4 md:p-8">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl font-mono">
                                {stat.value}
                            </div>
                            <div className="mt-1 text-xs font-medium text-muted-foreground">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
