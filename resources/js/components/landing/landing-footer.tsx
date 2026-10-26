import { useTranslations } from '@/hooks/use-translations';
import { Link } from '@inertiajs/react';
import { CheckCircle2, HardHat } from 'lucide-react';

export function LandingFooter() {
    const { t } = useTranslations();

    const footerSections = [
        {
            title: t('landing.footer.product.title', 'Product'),
            links: [
                { label: 'Work Orders', href: '/work-orders' },
                { label: 'Mobile Tech Portal', href: '/my-jobs' },
                { label: 'Customers & Sites', href: '/customers' },
                { label: 'Checklist Templates', href: '/checklist-templates' },
                { label: 'Automations', href: '/automations' },
                { label: 'Field Reports', href: '/reports' },
            ],
        },
        {
            title: t('landing.footer.billing.title', 'Pricing & Billing'),
            links: [
                { label: 'Subscription Plans', href: '#pricing' },
                { label: 'Razorpay UPI & Cards', href: '/billing' },
                { label: 'Plan Comparison', href: '/billing/compare' },
            ],
        },
        {
            title: t('landing.footer.resources.title', 'Support & System'),
            links: [
                { label: 'Help Center', href: '/help' },
                { label: 'System Status', href: '/status' },
                { label: 'Product Changelog', href: '/changelog' },
            ],
        },
    ];

    return (
        <footer className="border-t border-border/60 bg-muted/30 pt-16 pb-12 text-foreground">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 md:grid-cols-5">
                    {/* Brand Info */}
                    <div className="md:col-span-2 space-y-4">
                        <Link href="/" className="inline-flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                                <HardHat className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight">CrewFlow</span>
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                                CRM
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                            {t(
                                'landing.footer.description',
                                'All-in-one field service CRM and work order management platform. Purpose-built for high-performance contractors, technicians, and facility teams.',
                            )}
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>All Systems Operational • Razorpay Gateway Active</span>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    {footerSections.map((section) => (
                        <div key={section.title} className="space-y-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                                {section.title}
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        {link.href.startsWith('#') ? (
                                            <a
                                                href={link.href}
                                                className="hover:text-foreground transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                className="hover:text-foreground transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row text-xs text-muted-foreground">
                    <p>
                        © {new Date().getFullYear()} CrewFlow Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/help" className="hover:text-foreground transition-colors">
                            Help
                        </Link>
                        <Link href="/status" className="hover:text-foreground transition-colors">
                            Status
                        </Link>
                        <Link href="/changelog" className="hover:text-foreground transition-colors">
                            Changelog
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
