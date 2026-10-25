import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    Filter,
    HardHat,
    MapPin,
    Plus,
    Search,
    ShieldAlert,
    UserCheck,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface Customer {
    id: number;
    name: string;
    company_name: string | null;
}

interface ServiceLocation {
    id: number;
    name: string;
    city: string;
    state: string | null;
}

interface UserSummary {
    id: number;
    name: string;
    email: string;
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
    assigned_worker: UserSummary | null;
    created_at: string;
}

interface WorkOrdersIndexProps {
    workOrders: {
        data: WorkOrder[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search: string;
        status: string | null;
        priority: string | null;
        worker_id: string | null;
        overdue: boolean;
    };
    stats: {
        total_active: number;
        overdue: number;
        pending_review: number;
        completed_today: number;
    };
    workers: UserSummary[];
    canManage: boolean;
    userRole: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Work Orders', href: '/work-orders' },
];

export default function WorkOrdersIndex({
    workOrders,
    filters,
    stats,
    workers,
    canManage,
    userRole,
}: WorkOrdersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [priority, setPriority] = useState(filters.priority || 'all');
    const [workerId, setWorkerId] = useState(filters.worker_id || 'all');
    const [overdue, setOverdue] = useState(filters.overdue || false);

    const applyFilters = (overrides = {}) => {
        const queryParams = {
            search,
            status: status === 'all' ? null : status,
            priority: priority === 'all' ? null : priority,
            worker_id: workerId === 'all' ? null : workerId,
            overdue: overdue ? '1' : null,
            ...overrides,
        };

        // Filter out null or empty
        const cleanQuery: Record<string, string> = {};
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== null && value !== '' && value !== undefined) {
                cleanQuery[key] = String(value);
            }
        }

        router.get('/work-orders', cleanQuery, { preserveState: true, replace: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setPriority('all');
        setWorkerId('all');
        setOverdue(false);
        router.get('/work-orders');
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'draft':
                return <Badge variant="secondary">Draft</Badge>;
            case 'assigned':
                return <Badge variant="outline" className="border-blue-500/40 text-blue-600 dark:text-blue-400">Assigned</Badge>;
            case 'in_progress':
                return <Badge className="bg-sky-600 hover:bg-sky-700">In Progress</Badge>;
            case 'submitted':
                return <Badge className="bg-amber-600 hover:bg-amber-700">Pending Review</Badge>;
            case 'changes_requested':
                return <Badge variant="destructive">Changes Requested</Badge>;
            case 'completed':
                return <Badge className="bg-emerald-600 hover:bg-emerald-700">Completed</Badge>;
            case 'cancelled':
                return <Badge variant="secondary" className="opacity-70">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{st}</Badge>;
        }
    };

    const getPriorityBadge = (pri: string) => {
        switch (pri) {
            case 'urgent':
                return <Badge variant="destructive" className="uppercase text-[10px] tracking-wider">Urgent</Badge>;
            case 'high':
                return <Badge variant="outline" className="border-orange-500/50 text-orange-600 dark:text-orange-400 uppercase text-[10px] tracking-wider">High</Badge>;
            case 'medium':
                return <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400 uppercase text-[10px] tracking-wider">Medium</Badge>;
            default:
                return <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">Low</Badge>;
        }
    };

    const isJobOverdue = (dueDate: string | null, st: string) => {
        if (!dueDate || st === 'completed' || st === 'cancelled') {
            return false;
        }
        return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Work Orders & Dispatch - CrewFlow" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Work Orders & Operations</h1>
                        <p className="text-muted-foreground text-sm">
                            Schedule, assign, and track service jobs across your mobile workforce.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/my-jobs">
                                <HardHat className="mr-2 h-4 w-4" />
                                My Field Jobs
                            </Link>
                        </Button>

                        {canManage && (
                            <Button asChild className="gap-2">
                                <Link href="/work-orders/create">
                                    <Plus className="h-4 w-4" />
                                    Create Work Order
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Dashboard Operations Metrics */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card
                        className={`cursor-pointer transition-all hover:border-primary/50 ${status === 'all' && !overdue ? 'ring-1 ring-primary/40' : ''}`}
                        onClick={() => {
                            setStatus('all');
                            setOverdue(false);
                            applyFilters({ status: null, overdue: null });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                            <Clock className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_active}</div>
                            <p className="text-muted-foreground text-xs mt-1">Jobs currently open</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`cursor-pointer transition-all hover:border-destructive/50 ${overdue ? 'ring-2 ring-destructive' : ''}`}
                        onClick={() => {
                            const newOverdue = !overdue;
                            setOverdue(newOverdue);
                            applyFilters({ overdue: newOverdue ? '1' : null });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-destructive">Overdue Jobs</CardTitle>
                            <AlertCircle className="text-destructive h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
                            <p className="text-muted-foreground text-xs mt-1">Past scheduled due date</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`cursor-pointer transition-all hover:border-amber-500/50 ${status === 'submitted' ? 'ring-2 ring-amber-500' : ''}`}
                        onClick={() => {
                            setStatus('submitted');
                            setOverdue(false);
                            applyFilters({ status: 'submitted', overdue: null });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                Pending Review
                            </CardTitle>
                            <ShieldAlert className="text-amber-600 dark:text-amber-400 h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {stats.pending_review}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">Awaiting manager approval</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`cursor-pointer transition-all hover:border-emerald-500/50 ${status === 'completed' ? 'ring-2 ring-emerald-500' : ''}`}
                        onClick={() => {
                            setStatus('completed');
                            setOverdue(false);
                            applyFilters({ status: 'completed', overdue: null });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                Completed Today
                            </CardTitle>
                            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {stats.completed_today}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">Signed off by reviewer</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="relative flex-1">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by order #, title, customer name..."
                                    className="pl-9"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                                <Select
                                    value={status}
                                    onValueChange={(val) => {
                                        setStatus(val);
                                        applyFilters({ status: val === 'all' ? null : val });
                                    }}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="assigned">Assigned</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="submitted">Pending Review</SelectItem>
                                        <SelectItem value="changes_requested">Changes Requested</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={priority}
                                    onValueChange={(val) => {
                                        setPriority(val);
                                        applyFilters({ priority: val === 'all' ? null : val });
                                    }}
                                >
                                    <SelectTrigger className="w-[130px]">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priorities</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>

                                {canManage && (
                                    <Select
                                        value={workerId}
                                        onValueChange={(val) => {
                                            setWorkerId(val);
                                            applyFilters({ worker_id: val === 'all' ? null : val });
                                        }}
                                    >
                                        <SelectTrigger className="w-[160px]">
                                            <SelectValue placeholder="Assigned Worker" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Workers</SelectItem>
                                            {workers.map((w) => (
                                                <SelectItem key={w.id} value={String(w.id)}>
                                                    {w.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {(search || status !== 'all' || priority !== 'all' || workerId !== 'all' || overdue) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="gap-1 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Work Orders Table */}
                <Card>
                    <CardHeader className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                                Work Orders ({workOrders.total})
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {workOrders.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Clock className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
                                <h3 className="text-lg font-medium">No work orders found</h3>
                                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                                    {search || status !== 'all' || priority !== 'all'
                                        ? 'No jobs match your filter criteria. Try clearing some filters.'
                                        : 'No work orders currently scheduled.'}
                                </p>
                                {canManage && !search && (
                                    <Button asChild className="mt-4 gap-2">
                                        <Link href="/work-orders/create">
                                            <Plus className="h-4 w-4" />
                                            Create First Work Order
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order #</TableHead>
                                        <TableHead>Job Title & Client</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Worker</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workOrders.data.map((wo) => {
                                        const overdueItem = isJobOverdue(wo.due_date, wo.status);

                                        return (
                                            <TableRow key={wo.id} className={overdueItem ? 'bg-destructive/5' : ''}>
                                                <TableCell className="font-mono font-semibold text-xs">
                                                    <Link
                                                        href={`/work-orders/${wo.id}`}
                                                        className="text-primary hover:underline font-bold"
                                                    >
                                                        {wo.order_number}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-0.5">
                                                        <Link
                                                            href={`/work-orders/${wo.id}`}
                                                            className="font-medium text-sm hover:underline"
                                                        >
                                                            {wo.title}
                                                        </Link>
                                                        <p className="text-muted-foreground flex items-center gap-1 text-xs">
                                                            <Building2 className="h-3 w-3" />
                                                            {wo.customer.company_name
                                                                ? `${wo.customer.name} (${wo.customer.company_name})`
                                                                : wo.customer.name}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {wo.service_location ? (
                                                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                                            <MapPin className="h-3 w-3" />
                                                            {wo.service_location.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs italic">
                                                            No site set
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {wo.assigned_worker ? (
                                                        <span className="flex items-center gap-1.5 text-xs font-medium">
                                                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                                                            {wo.assigned_worker.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs italic">
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                                                <TableCell>{getStatusBadge(wo.status)}</TableCell>
                                                <TableCell>
                                                    {wo.due_date ? (
                                                        <span
                                                            className={`flex items-center gap-1 text-xs font-medium ${overdueItem ? 'text-destructive font-bold' : 'text-muted-foreground'}`}
                                                        >
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(wo.due_date).toLocaleDateString()}
                                                            {overdueItem && ' (Overdue)'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/work-orders/${wo.id}`}>
                                                            View
                                                            <ChevronRight className="ml-1 h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {workOrders.last_page > 1 && (
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="text-muted-foreground text-sm">
                            Showing page {workOrders.current_page} of {workOrders.last_page}
                        </div>
                        <div className="flex gap-1">
                            {workOrders.links.map((link, idx) => (
                                <Button
                                    key={idx}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
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
