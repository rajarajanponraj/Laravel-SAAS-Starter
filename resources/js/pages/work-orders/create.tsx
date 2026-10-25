import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, ClipboardList, MapPin, UserCheck } from 'lucide-react';
import React, { useMemo } from 'react';

interface ServiceLocation {
    id: number;
    name: string;
    city: string;
    state: string | null;
}

interface Customer {
    id: number;
    name: string;
    company_name: string | null;
    service_locations?: ServiceLocation[];
}

interface Worker {
    id: number;
    name: string;
    email: string;
}

interface CreateWorkOrderProps {
    customers: Customer[];
    workers: Worker[];
    priorities: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Work Orders', href: '/work-orders' },
    { title: 'New Work Order', href: '/work-orders/create' },
];

export default function CreateWorkOrder({
    customers,
    workers,
    priorities,
}: CreateWorkOrderProps) {
    const urlParams = new URLSearchParams(window.location.search);
    const initialCustomerId = urlParams.get('customer_id') || '';

    const { data, setData, post, processing, errors } = useForm({
        customer_id: initialCustomerId,
        service_location_id: '',
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        scheduled_start_at: '',
        scheduled_end_at: '',
        assigned_to_user_id: '',
    });

    const selectedCustomer = useMemo(() => {
        return customers.find((c) => String(c.id) === String(data.customer_id));
    }, [customers, data.customer_id]);

    const availableLocations = useMemo(() => {
        return selectedCustomer?.service_locations || [];
    }, [selectedCustomer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/work-orders');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Work Order - CrewFlow" />

            <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/work-orders">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Work Order</h1>
                        <p className="text-muted-foreground text-sm">
                            Dispatch a new job, specify site requirements, and assign field personnel.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer & Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                Customer & Location
                            </CardTitle>
                            <CardDescription>
                                Select the target client and physical service location.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="customer_id">Customer *</Label>
                                <Select
                                    value={data.customer_id}
                                    onValueChange={(val) => {
                                        setData((prev) => ({
                                            ...prev,
                                            customer_id: val,
                                            service_location_id: '', // reset location
                                        }));
                                    }}
                                >
                                    <SelectTrigger id="customer_id">
                                        <SelectValue placeholder="Select a customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name} {c.company_name ? `(${c.company_name})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.customer_id && (
                                    <p className="text-xs text-destructive">{errors.customer_id}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="service_location_id">Service Location</Label>
                                <Select
                                    value={data.service_location_id}
                                    onValueChange={(val) => setData('service_location_id', val)}
                                    disabled={!data.customer_id || availableLocations.length === 0}
                                >
                                    <SelectTrigger id="service_location_id">
                                        <SelectValue
                                            placeholder={
                                                !data.customer_id
                                                    ? 'Select customer first'
                                                    : availableLocations.length === 0
                                                      ? 'No locations registered'
                                                      : 'Select service site'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableLocations.map((loc) => (
                                            <SelectItem key={loc.id} value={String(loc.id)}>
                                                {loc.name} ({loc.city}, {loc.state})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.service_location_id && (
                                    <p className="text-xs text-destructive">{errors.service_location_id}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Job Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-primary" />
                                Work Order Scope
                            </CardTitle>
                            <CardDescription>
                                Provide job title, priority, instructions, and target dates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Job Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Electrical Panel Upgrade & Breaker Inspection"
                                    required
                                />
                                {errors.title && (
                                    <p className="text-xs text-destructive">{errors.title}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Priority *</Label>
                                    <Select
                                        value={data.priority}
                                        onValueChange={(val) => setData('priority', val)}
                                    >
                                        <SelectTrigger id="priority">
                                            <SelectValue placeholder="Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.priority && (
                                        <p className="text-xs text-destructive">{errors.priority}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                    />
                                    {errors.due_date && (
                                        <p className="text-xs text-destructive">{errors.due_date}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Job Instructions & Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Detailed work instructions, required tools, client special requests..."
                                    rows={4}
                                />
                                {errors.description && (
                                    <p className="text-xs text-destructive">{errors.description}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Worker Assignment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-primary" />
                                Worker Assignment
                            </CardTitle>
                            <CardDescription>
                                Assign a team member immediately or leave unassigned as a draft.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2 sm:max-w-md">
                                <Label htmlFor="assigned_to_user_id">Assign To Worker</Label>
                                <Select
                                    value={data.assigned_to_user_id}
                                    onValueChange={(val) => setData('assigned_to_user_id', val)}
                                >
                                    <SelectTrigger id="assigned_to_user_id">
                                        <SelectValue placeholder="Unassigned (Draft status)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Leave Unassigned)</SelectItem>
                                        {workers.map((w) => (
                                            <SelectItem key={w.id} value={String(w.id)}>
                                                {w.name} ({w.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.assigned_to_user_id && (
                                    <p className="text-xs text-destructive">{errors.assigned_to_user_id}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/work-orders">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing} className="px-6">
                            {processing ? 'Creating...' : 'Create & Dispatch'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
