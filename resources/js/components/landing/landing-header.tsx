import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTranslations } from '@/hooks/use-translations';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ClipboardCheck, HardHat, Menu, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface LandingHeaderProps {
    canRegister?: boolean;
}

export function LandingHeader({ canRegister = true }: LandingHeaderProps) {
    const { t } = useTranslations();
    const { auth, locale } = usePage<SharedData>().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: '#features', label: t('landing.nav.features', 'Features') },
        { href: '#solutions', label: t('landing.nav.solutions', 'Work Orders & Field App') },
        { href: '#pricing', label: t('landing.nav.pricing', 'Pricing') },
        { href: '#testimonials', label: t('landing.nav.testimonials', 'Reviews') },
        { href: '#faq', label: t('landing.nav.faq', 'FAQ') },
    ];

    const scrollTo = (href: string) => {
        if (href.startsWith('#')) {
            const element = document.querySelector(href);
            element?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Brand Logo */}
                <Link href="/" className="group flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-transform group-hover:scale-105">
                        <HardHat className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg font-extrabold tracking-tight text-foreground">
                                CrewFlow
                            </span>
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                                CRM
                            </span>
                        </div>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-7 md:flex">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            onClick={(e) => {
                                e.preventDefault();
                                scrollTo(link.href);
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                    <Link
                        href="/help"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {t('navigation.help_center', 'Help')}
                    </Link>
                </nav>

                {/* Right controls */}
                <div className="hidden items-center gap-3 md:flex">
                    <LanguageSwitcher currentLocale={locale} />
                    <AppearanceToggleDropdown />
                    {auth.user ? (
                        <Button asChild className="gap-2 shadow-sm">
                            <Link href={dashboard()}>
                                <ClipboardCheck className="h-4 w-4" />
                                {t('landing.nav.dashboard', 'Launch App')}
                            </Link>
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" asChild className="text-sm font-medium">
                                <Link href={login()}>
                                    {t('landing.nav.signin', 'Sign In')}
                                </Link>
                            </Button>
                            {canRegister && (
                                <Button asChild className="gap-2 shadow-sm">
                                    <Link href={register()}>
                                        <Sparkles className="h-4 w-4" />
                                        {t('landing.hero.get_started', 'Start Free Trial')}
                                    </Link>
                                </Button>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile Menu Trigger */}
                <div className="flex items-center gap-2 md:hidden">
                    <AppearanceToggleDropdown />
                    <Sheet
                        open={mobileMenuOpen}
                        onOpenChange={setMobileMenuOpen}
                    >
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-full sm:max-w-sm"
                        >
                            <div className="flex flex-col gap-6 pt-6">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <HardHat className="h-4 w-4" />
                                    </div>
                                    <span className="text-lg font-bold">CrewFlow</span>
                                </div>
                                <nav className="flex flex-col gap-4">
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            onClick={(e) => {
                                                setMobileMenuOpen(false);
                                                e.preventDefault();
                                                setTimeout(() => scrollTo(link.href), 150);
                                            }}
                                            className="text-base font-medium text-foreground hover:text-primary transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                    <Link
                                        href="/help"
                                        className="text-base font-medium text-foreground hover:text-primary transition-colors"
                                    >
                                        {t('navigation.help_center', 'Help Center')}
                                    </Link>
                                    <Link
                                        href="/status"
                                        className="text-base font-medium text-foreground hover:text-primary transition-colors"
                                    >
                                        {t('navigation.status_page', 'System Status')}
                                    </Link>
                                </nav>
                                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                                    {auth.user ? (
                                        <Button asChild className="w-full">
                                            <Link href={dashboard()}>
                                                {t('landing.nav.dashboard', 'Launch App')}
                                            </Link>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="w-full"
                                            >
                                                <Link href={login()}>
                                                    {t('landing.nav.signin', 'Sign In')}
                                                </Link>
                                            </Button>
                                            {canRegister && (
                                                <Button
                                                    asChild
                                                    className="w-full"
                                                >
                                                    <Link href={register()}>
                                                        {t('landing.hero.get_started', 'Start Free Trial')}
                                                    </Link>
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
