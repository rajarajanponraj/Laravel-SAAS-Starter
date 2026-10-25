import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Clock,
    Download,
    FileSpreadsheet,
    HardHat,
    TrendingUp,
    Users,
} from 'lucide-react';
import React from 'react';

interface Metrics {
    total_jobs: number;
    completed_jobs: number;
    in_progress_jobs: number;
    submitted_jobs: number;
    overdue_jobs: number;
    on_time_rate: number;
}

interface WorkerWorkload {
    id: number;
    name: string;
    email: string;
    active_jobs: number;
    completed_jobs: number;
}

interface CustomerStat {
    id: number;
    name: string;
    company_name: string | null;
    total_jobs: number;
}

interface Props {
    metrics: Metrics;
    workers: WorkerWorkload[];
    topCustomers: CustomerStat[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reports', href: '/reports' },
];

export default function ReportsIndex({ metrics, workers, topCustomers }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operations Reports" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {/* Header with Export CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            Operations & Workforce Reports
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Operational performance, on-time completion rates, technician workload, and customer service history.
                        </p>
                    </div>

                    <a href="/reports/export-work-orders" download>
                        <Button className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            <span>Export All Jobs (CSV)</span>
                        </Button>
                    </a>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_jobs}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.completed_jobs} completed · {metrics.in_progress_jobs} in progress
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">On-Time Completion Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {metrics.on_time_rate}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Completed before or on scheduled due date
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Overdue Jobs</CardTitle>
                            <AlertTriangle className={`h-4 w-4 ${metrics.overdue_jobs > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${metrics.overdue_jobs > 0 ? 'text-destructive' : ''}`}>
                                {metrics.overdue_jobs}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.overdue_jobs > 0 ? 'Requires immediate supervisor dispatch' : 'All jobs are within schedule'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {metrics.submitted_jobs}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Awaiting supervisor sign-off or changes
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Technician Workload & Customer Breakdown Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Worker Workload */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <HardHat className="h-5 w-5 text-primary" />
                                <span>Technician Workload & Productivity</span>
                            </CardTitle>
                            <CardDescription>
                                Active assignments and completed jobs per field worker in this workspace.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {workers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No technicians found in workspace.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Technician</TableHead>
                                                <TableHead className="text-center">Active Jobs</TableHead>
                                                <TableHead className="text-center">Completed</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {workers.map((worker) => (
                                                <TableRow key={worker.id}>
                                                    <TableCell>
                                                        <div className="font-medium text-foreground">{worker.name}</div>
                                                        <div className="text-xs text-muted-foreground">{worker.email}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-semibold">
                                                        {worker.active_jobs}
                                                    </TableCell>
                                                    <TableCell className="text-center text-muted-foreground">
                                                        {worker.completed_jobs}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {worker.active_jobs > 3 ? (
                                                            <Badge variant="destructive">High Load</Badge>
                                                        ) : worker.active_jobs > 0 ? (
                                                            <Badge variant="secondary">Active</Badge>
                                                        ) : (
                                                            <Badge variant="outline">Available</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customer Service Volume */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="h-5 w-5 text-primary" />
                                <span>Customer Service Volume</span>
                            </CardTitle>
                            <CardDescription>
                                Top customer accounts ranked by total work order volume.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topCustomers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No customer records found yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Company</TableHead>
                                                <TableHead className="text-right">Total Jobs</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {topCustomers.map((customer) => (
                                                <TableRow key={customer.id}>
                                                    <TableCell className="font-medium text-foreground">
                                                        {customer.name}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {customer.company_name || 'Individual'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-primary">
                                                        {customer.total_jobs}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
