import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    HardHat,
    MapPin,
    Phone,
    Play,
    Sparkles,
} from 'lucide-react';
import React from 'react';

interface Customer {
    id: number;
    name: string;
    phone: string | null;
    company_name: string | null;
}

interface ServiceLocation {
    id: number;
    name: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string | null;
    postal_code: string | null;
}

interface WorkOrder {
    id: number;
    order_number: string;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'draft' | 'assigned' | 'in_progress' | 'submitted' | 'changes_requested' | 'completed' | 'cancelled';
    due_date: string | null;
    customer: Customer;
    service_location: ServiceLocation | null;
    created_at: string;
}

interface WorkerJobsProps {
    jobs: {
        data: WorkOrder[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    currentTab: 'active' | 'completed' | 'all';
    counts: {
        active: number;
        completed: number;
    };
}

export default function WorkerMyJobs({ jobs, currentTab, counts }: WorkerJobsProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'My Jobs', href: '/my-jobs' },
    ];

    const getStatusBadge = (status: WorkOrder['status']) => {
        switch (status) {
            case 'assigned':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 text-xs">Ready to Start</Badge>;
            case 'in_progress':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 text-xs">In Progress</Badge>;
            case 'submitted':
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 text-xs">Under Review</Badge>;
            case 'changes_requested':
                return <Badge variant="destructive" className="text-xs">Changes Needed</Badge>;
            case 'completed':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-xs">Completed</Badge>;
            default:
                return <Badge variant="outline" className="text-xs">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: WorkOrder['priority']) => {
        switch (priority) {
            case 'urgent':
                return <Badge variant="destructive" className="text-xs animate-pulse">Urgent</Badge>;
            case 'high':
                return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 text-xs">High</Badge>;
            case 'medium':
                return <Badge variant="secondary" className="text-xs">Medium</Badge>;
            case 'low':
                return <Badge variant="outline" className="text-xs text-muted-foreground">Low</Badge>;
        }
    };

    const handleQuickStart = (e: React.MouseEvent, workOrderId: number) => {
        e.preventDefault();
        e.stopPropagation();
        router.put(`/work-orders/${workOrderId}/status`, {
            to_status: 'in_progress',
            comment: 'Technician quick-started work from mobile view.',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Assigned Jobs - CrewFlow" />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
                {/* Header for Technician */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <HardHat className="h-5 w-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">My Jobs</h1>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Your dispatched assignments, site locations, and checklist execution.
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-xl self-start sm:self-auto border">
                        <Link
                            href="/my-jobs?tab=active"
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                                currentTab === 'active'
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span>Active</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                                currentTab === 'active' ? 'bg-primary/15 text-primary' : 'bg-muted-foreground/15 text-muted-foreground'
                            }`}>
                                {counts.active}
                            </span>
                        </Link>
                        <Link
                            href="/my-jobs?tab=completed"
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                                currentTab === 'completed'
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span>Completed</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                                currentTab === 'completed' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted-foreground/15 text-muted-foreground'
                            }`}>
                                {counts.completed}
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Jobs List */}
                {jobs.data.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                            <div className="p-3 bg-muted rounded-full mb-3">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">
                                {currentTab === 'active' ? 'You are all caught up!' : 'No completed jobs yet'}
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1">
                                {currentTab === 'active'
                                    ? 'No active work orders are assigned to you at the moment. Enjoy the downtime or check with your dispatcher.'
                                    : 'Jobs you finish and get approved will appear here in your work history.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3.5">
                        {jobs.data.map((job) => {
                            const isChangesRequested = job.status === 'changes_requested';
                            const isReadyToStart = job.status === 'assigned';

                            return (
                                <Link
                                    key={job.id}
                                    href={`/work-orders/${job.id}`}
                                    className="block group"
                                >
                                    <Card
                                        className={`transition-all duration-150 hover:shadow-md hover:border-primary/50 relative overflow-hidden ${
                                            isChangesRequested
                                                ? 'border-destructive/60 bg-destructive/5'
                                                : job.priority === 'urgent'
                                                ? 'border-orange-500/50'
                                                : ''
                                        }`}
                                    >
                                        {/* Status Accent Bar */}
                                        {isChangesRequested && (
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
                                        )}

                                        <CardContent className="p-4 sm:p-5">
                                            {/* Top Line: Badges & Order Number */}
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-foreground">
                                                        {job.order_number}
                                                    </span>
                                                    {getPriorityBadge(job.priority)}
                                                </div>
                                                <div>{getStatusBadge(job.status)}</div>
                                            </div>

                                            {/* Job Title */}
                                            <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                                                {job.title}
                                            </h3>

                                            {/* Location & Customer metadata */}
                                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                                <div className="flex items-start gap-2">
                                                    <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                    <span className="font-medium text-foreground">
                                                        {job.customer.name}
                                                        {job.customer.company_name ? ` (${job.customer.company_name})` : ''}
                                                    </span>
                                                    {job.customer.phone && (
                                                        <a
                                                            href={`tel:${job.customer.phone}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
                                                        >
                                                            <Phone className="h-3.5 w-3.5" />
                                                            <span>Call</span>
                                                        </a>
                                                    )}
                                                </div>

                                                {job.service_location && (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                        <span className="truncate">
                                                            {job.service_location.address_line1}, {job.service_location.city}
                                                        </span>
                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                                `${job.service_location.address_line1}, ${job.service_location.city}`,
                                                            )}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            <span>Maps</span>
                                                        </a>
                                                    </div>
                                                )}

                                                {job.due_date && (
                                                    <div className="flex items-center gap-2 pt-1 text-muted-foreground">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>Due: {new Date(job.due_date).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom Mobile Action */}
                                            {isReadyToStart && (
                                                <div className="mt-4 pt-3 border-t flex justify-end">
                                                    <Button
                                                        size="sm"
                                                        className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                                                        onClick={(e) => handleQuickStart(e, job.id)}
                                                    >
                                                        <Play className="h-3.5 w-3.5" />
                                                        Start Job Now
                                                    </Button>
                                                </div>
                                            )}

                                            {isChangesRequested && (
                                                <div className="mt-3 p-2 bg-destructive/10 rounded text-xs text-destructive flex items-center gap-1.5 font-medium">
                                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                    <span>Reviewer requested changes. Tap to view notes & resubmit.</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {jobs.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                        <div>
                            Showing page {jobs.current_page} of {jobs.last_page} ({jobs.total} jobs)
                        </div>
                        <div className="flex gap-1">
                            {jobs.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    className={`px-3 py-1.5 rounded text-xs font-medium ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : link.url
                                            ? 'bg-muted hover:bg-muted/80 text-foreground'
                                            : 'text-muted-foreground/50 pointer-events-none'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
