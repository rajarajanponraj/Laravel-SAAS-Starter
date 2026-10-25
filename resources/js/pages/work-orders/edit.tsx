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
import { ArrowLeft, Building2, ClipboardList } from 'lucide-react';
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

interface WorkOrder {
    id: number;
    order_number: string;
    customer_id: number;
    service_location_id: number | null;
    title: string;
    description: string | null;
    priority: string;
    due_date: string | null;
}

interface EditWorkOrderProps {
    workOrder: WorkOrder;
    customers: Customer[];
    priorities: string[];
}

export default function EditWorkOrder({
    workOrder,
    customers,
    priorities,
}: EditWorkOrderProps) {
    const { data, setData, put, processing, errors } = useForm({
        customer_id: String(workOrder.customer_id),
        service_location_id: workOrder.service_location_id ? String(workOrder.service_location_id) : '',
        title: workOrder.title,
        description: workOrder.description || '',
        priority: workOrder.priority,
        due_date: workOrder.due_date ? workOrder.due_date.substring(0, 10) : '',
    });

    const selectedCustomer = useMemo(() => {
        return customers.find((c) => String(c.id) === String(data.customer_id));
    }, [customers, data.customer_id]);

    const availableLocations = useMemo(() => {
        return selectedCustomer?.service_locations || [];
    }, [selectedCustomer]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Work Orders', href: '/work-orders' },
        { title: workOrder.order_number, href: `/work-orders/${workOrder.id}` },
        { title: 'Edit', href: `/work-orders/${workOrder.id}/edit` },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/work-orders/${workOrder.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${workOrder.order_number} - CrewFlow`} />

            <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/work-orders/${workOrder.id}`}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit {workOrder.order_number}</h1>
                        <p className="text-muted-foreground text-sm">Update work order specifications and client assignment.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                Customer & Service Location
                            </CardTitle>
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
                                            service_location_id: '',
                                        }));
                                    }}
                                >
                                    <SelectTrigger id="customer_id">
                                        <SelectValue placeholder="Select customer" />
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
                                        <SelectValue placeholder="Select location" />
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

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-primary" />
                                Job Scope
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Job Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
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
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Job Instructions</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href={`/work-orders/${workOrder.id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
