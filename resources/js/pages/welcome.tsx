import {
    LandingCta,
    LandingFaq,
    LandingFeatures,
    LandingFooter,
    LandingHeader,
    LandingHero,
    LandingPricing,
    LandingTestimonials,
} from '@/components/landing';
import { useTranslations } from '@/hooks/use-translations';
import { Head } from '@inertiajs/react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { t } = useTranslations();

    return (
        <>
            <Head
                title={t(
                    'landing.meta.title',
                    'CrewFlow - Field Service & Work Order CRM for Modern Operations',
                )}
            >
                <meta
                    name="description"
                    content={t(
                        'landing.meta.description',
                        'All-in-one field service CRM and work order management software. Dispatch technicians in seconds, track mobile jobs, capture verified photo & signature evidence, and automate billing with Razorpay.',
                    )}
                />
                <meta
                    name="keywords"
                    content={t(
                        'landing.meta.keywords',
                        'field service crm, work order management, technician dispatching, mobile checklist, contractor software, hvac crm, maintenance management, razorpay payments, photo evidence',
                    )}
                />
                <meta
                    property="og:title"
                    content={t(
                        'landing.meta.og_title',
                        'CrewFlow - Field Service & Work Order CRM for Modern Operations',
                    )}
                />
                <meta
                    property="og:description"
                    content={t(
                        'landing.meta.og_description',
                        'Dispatch work orders, track mobile technicians, enforce safety checklists, and capture verified proof of work with CrewFlow.',
                    )}
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content={t(
                        'landing.meta.twitter_title',
                        'CrewFlow - Field Service & Work Order CRM',
                    )}
                />
                <meta
                    name="twitter:description"
                    content={t(
                        'landing.meta.twitter_description',
                        'Modern field operations and work order management software for high-efficiency service crews.',
                    )}
                />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&instrument-sans:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
                <LandingHeader canRegister={canRegister} />
                <main>
                    <LandingHero />
                    <LandingFeatures />
                    <LandingPricing />
                    <LandingTestimonials />
                    <LandingFaq />
                    <LandingCta />
                </main>
                <LandingFooter />
            </div>
        </>
    );
}
