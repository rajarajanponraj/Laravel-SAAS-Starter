import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    ExternalLink,
    Megaphone,
    ShieldCheck,
    Sparkles,
    Wrench,
    Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AdBannerProps {
    variant?: 'sidebar' | 'banner' | 'card';
    className?: string;
}

export function AdBanner({ variant = 'sidebar', className = '' }: AdBannerProps) {
    const { show_ads, ads_config } = usePage<SharedData>().props as {
        show_ads?: boolean;
        ads_config?: {
            enabled: boolean;
            provider: string;
            adsense_client?: string;
            adsense_slot_sidebar?: string;
            adsense_slot_banner?: string;
        };
    };

    const [adIndex, setAdIndex] = useState(0);

    // List of curated field service & trade business sponsors / promotional prompts
    const sponsorAds = [
        {
            title: 'Titan Workwear & Gear',
            tagline: 'Heavy-duty contractor apparel & safety gear. Save 15% with code CREWFLOW15.',
            category: 'Equipment',
            icon: Wrench,
            link: 'https://example.com/workwear',
        },
        {
            title: 'NextGen Dispatch & GPS',
            tagline: 'Never miss an emergency call. Upgrade to Pro for 100% ad-free automated dispatching.',
            category: 'CrewFlow Pro',
            icon: Zap,
            link: '/billing/plans',
            isInternal: true,
        },
        {
            title: 'ProContractor Business Coverage',
            tagline: 'Fast, affordable general liability insurance for trade contractors and repair crews.',
            category: 'Insurance',
            icon: ShieldCheck,
            link: 'https://example.com/insurance',
        },
    ];

    useEffect(() => {
        // Rotate sponsor ads periodically
        const interval = setInterval(() => {
            setAdIndex((prev) => (prev + 1) % sponsorAds.length);
        }, 30000);

        return () => clearInterval(interval);
    }, [sponsorAds.length]);

    // If user is on Pro or Business plan, ads are strictly disabled
    if (!show_ads) {
        return null;
    }

    const currentAd = sponsorAds[adIndex];
    const AdIcon = currentAd.icon;

    // Sidebar Variant: Compact card fitted for the navigation sidebar
    if (variant === 'sidebar') {
        return (
            <div className={`px-2 py-1.5 ${className}`}>
                <Card className="border border-border/60 bg-muted/30 shadow-none overflow-hidden text-xs">
                    <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Megaphone className="h-3 w-3 text-primary" />
                                Sponsor
                            </span>
                            <Link
                                href="/billing/plans"
                                className="text-[10px] font-medium text-primary hover:underline flex items-center gap-0.5"
                            >
                                <Sparkles className="h-2.5 w-2.5" />
                                Ad-Free
                            </Link>
                        </div>

                        <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                                <AdIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <span className="truncate">{currentAd.title}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                {currentAd.tagline}
                            </p>
                        </div>

                        <div className="pt-1 flex items-center justify-between border-t border-border/40">
                            {currentAd.isInternal ? (
                                <Link
                                    href={currentAd.link}
                                    className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                    Learn More &rarr;
                                </Link>
                            ) : (
                                <a
                                    href={currentAd.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                    Visit Partner <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            )}

                            <Link href="/billing/plans">
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground">
                                    Upgrade
                                </Badge>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Horizontal Banner Variant: For Dashboard and Work Orders views
    return (
        <div className={`w-full ${className}`}>
            <div className="relative rounded-lg border border-border/60 bg-gradient-to-r from-muted/50 via-background to-muted/40 p-3 sm:p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10 text-primary flex-shrink-0 mt-0.5 sm:mt-0">
                            <AdIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs sm:text-sm text-foreground">
                                    {currentAd.title}
                                </span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-muted-foreground">
                                    Free Plan Sponsor
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                                {currentAd.tagline}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                        {!currentAd.isInternal && (
                            <a
                                href={currentAd.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                            >
                                Details
                            </a>
                        )}

                        <Link href="/billing/plans">
                            <Button size="sm" variant="default" className="h-7 text-xs gap-1 shadow-xs">
                                <Sparkles className="h-3 w-3" />
                                Remove Ads (Go Pro)
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

