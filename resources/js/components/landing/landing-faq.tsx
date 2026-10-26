import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/use-translations';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function LandingFaq() {
    const { t } = useTranslations();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: t(
                'landing.faq.items.who_uses.question',
                'What types of businesses use CrewFlow?',
            ),
            answer: t(
                'landing.faq.items.who_uses.answer',
                'CrewFlow is built for commercial HVAC, electrical contractors, plumbing & mechanical specialists, facilities management companies, solar installers, elevator maintenance crews, and any field service organization managing mobile technicians and work orders.',
            ),
        },
        {
            question: t(
                'landing.faq.items.mobile_app.question',
                'Do field technicians need to install a heavy native app?',
            ),
            answer: t(
                'landing.faq.items.mobile_app.answer',
                'No! CrewFlow features a mobile-first web interface ("My Jobs") optimized for any smartphone or tablet browser. Technicians simply log in to see their daily job queue, service routes, customer phone numbers, checklist items, and photo upload tools without App Store delays.',
            ),
        },
        {
            question: t(
                'landing.faq.items.evidence.question',
                'How does tamper-proof photo and signature evidence work?',
            ),
            answer: t(
                'landing.faq.items.evidence.answer',
                'Technicians capture before/after photos directly on-site. Files are securely linked to the specific work order with verified timestamps and GPS coordinates. Once the task is completed, customers review the checklist on-screen and provide their digital signature to eliminate dispute risks.',
            ),
        },
        {
            question: t(
                'landing.faq.items.payment_methods.question',
                'What payment methods are supported for billing?',
            ),
            answer: t(
                'landing.faq.items.payment_methods.answer',
                'CrewFlow integrates with Razorpay for instant, friction-free billing in INR and international currencies. We support UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (RuPay, Visa, Mastercard), and NetBanking from 50+ major banks, accompanied by automated tax receipts.',
            ),
        },
        {
            question: t(
                'landing.faq.items.checklists.question',
                'Can I customize safety and quality checklists for our trade?',
            ),
            answer: t(
                'landing.faq.items.checklists.answer',
                'Yes. You can build reusable checklist templates for each trade or job type (preventative maintenance, emergency leak detection, seasonal tune-ups, lockout/tagout). You can set specific items as mandatory before a technician can mark the work order completed.',
            ),
        },
        {
            question: t(
                'landing.faq.items.import_data.question',
                'Can I import our existing customer directory and site locations?',
            ),
            answer: t(
                'landing.faq.items.import_data.answer',
                'Yes. You can easily import your customer accounts, secondary branch facility locations, contact numbers, and equipment records using our simple CSV template in under 2 minutes.',
            ),
        },
    ];

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-20 sm:py-32 bg-background relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <Badge variant="outline" className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary border-primary/30">
                        {t('landing.faq.badge', 'Got Questions?')}
                    </Badge>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                        {t(
                            'landing.faq.description',
                            'Everything you need to know about CrewFlow, our work order workflow, mobile technician access, and payment setup.',
                        )}
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="mx-auto mt-14 max-w-3xl space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div
                                key={faq.question}
                                className={`rounded-xl border transition-all ${
                                    isOpen
                                        ? 'border-primary/40 bg-card shadow-sm'
                                        : 'border-border/70 bg-card/60 hover:border-border'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    className="flex w-full items-center justify-between p-5 text-left font-semibold text-foreground"
                                >
                                    <span className="text-base sm:text-lg pr-4">{faq.question}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                            isOpen ? 'rotate-180 text-primary' : ''
                                        }`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Support Card */}
                <div className="mx-auto mt-12 max-w-xl text-center rounded-xl border border-border/60 bg-muted/30 p-6">
                    <p className="text-sm font-medium text-foreground">
                        Have a specialized workflow or fleet requirement?
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Our operations engineering team is available to assist with onboarding and custom templates.
                    </p>
                    <a
                        href="/help"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-primary hover:underline"
                    >
                        Visit Help Center & Guides &rarr;
                    </a>
                </div>
            </div>
        </section>
    );
}
