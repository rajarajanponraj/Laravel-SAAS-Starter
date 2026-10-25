import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    ChevronRight,
    ClipboardList,
    Clock,
    Edit2,
    Mail,
    MapPin,
    Phone,
    Plus,
    Trash2,
    UserCheck,
} from 'lucide-react';
import React, { useState } from 'react';

interface ServiceLocation {
    id: number;
    name: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string | null;
    postal_code: string | null;
    country: string;
    access_notes: string | null;
}

interface WorkOrder {
    id: number;
    order_number: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    service_location?: ServiceLocation | null;
    assigned_worker?: { id: number; name: string } | null;
}

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    notes: string | null;
    status: 'active' | 'archived';
    created_at: string;
}

interface CustomerShowProps {
    customer: Customer;
    serviceLocations: ServiceLocation[];
    recentWorkOrders: WorkOrder[];
    canManage: boolean;
}

export default function CustomerShow({
    customer,
    serviceLocations,
    recentWorkOrders,
    canManage,
}: CustomerShowProps) {
    const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
    const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);

    const editForm = useForm({
        name: customer.name,
        company_name: customer.company_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        notes: customer.notes || '',
        status: customer.status,
    });

    const locationForm = useForm({
        customer_id: customer.id,
        name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        access_notes: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Customers', href: '/customers' },
        { title: customer.name, href: `/customers/${customer.id}` },
    ];

    const handleEditCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        editForm.put(`/customers/${customer.id}`, {
            onSuccess: () => setIsEditCustomerOpen(false),
        });
    };

    const handleAddLocation = (e: React.FormEvent) => {
        e.preventDefault();
        locationForm.post('/service-locations', {
            onSuccess: () => {
                setIsAddLocationOpen(false);
                locationForm.reset();
            },
        });
    };

    const handleDeleteCustomer = () => {
        if (confirm(`Are you sure you want to delete customer ${customer.name}?`)) {
            router.delete(`/customers/${customer.id}`);
        }
    };

    const handleDeleteLocation = (locationId: number) => {
        if (confirm('Are you sure you want to delete this service location?')) {
            router.delete(`/service-locations/${locationId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${customer.name} - Customer Details`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header Back & Action Buttons */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/customers">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                                    {customer.status}
                                </Badge>
                            </div>
                            {customer.company_name && (
                                <p className="text-muted-foreground flex items-center gap-1.5 text-sm mt-0.5">
                                    <Building2 className="h-4 w-4" />
                                    {customer.company_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5">
                                        <Edit2 className="h-4 w-4" />
                                        Edit Details
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <form onSubmit={handleEditCustomer}>
                                        <DialogHeader>
                                            <DialogTitle>Edit Customer</DialogTitle>
                                            <DialogDescription>
                                                Update contact profile and company details.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-name">Name *</Label>
                                                <Input
                                                    id="edit-name"
                                                    value={editForm.data.name}
                                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-company">Company</Label>
                                                <Input
                                                    id="edit-company"
                                                    value={editForm.data.company_name}
                                                    onChange={(e) => editForm.setData('company_name', e.target.value)}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-email">Email</Label>
                                                    <Input
                                                        id="edit-email"
                                                        type="email"
                                                        value={editForm.data.email}
                                                        onChange={(e) => editForm.setData('email', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-phone">Phone</Label>
                                                    <Input
                                                        id="edit-phone"
                                                        value={editForm.data.phone}
                                                        onChange={(e) => editForm.setData('phone', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-notes">Notes</Label>
                                                <Textarea
                                                    id="edit-notes"
                                                    value={editForm.data.notes}
                                                    onChange={(e) => editForm.setData('notes', e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsEditCustomerOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={editForm.processing}>
                                                Save Changes
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteCustomer}
                                className="gap-1.5"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left Column: Customer Overview */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Contact Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-muted-foreground text-xs uppercase font-medium">Email</span>
                                <p className="text-sm font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {customer.email || 'Not provided'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-muted-foreground text-xs uppercase font-medium">Phone</span>
                                <p className="text-sm font-medium flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {customer.phone || 'Not provided'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-muted-foreground text-xs uppercase font-medium">Customer Since</span>
                                <p className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {new Date(customer.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            {customer.notes && (
                                <div className="space-y-1 border-t pt-4">
                                    <span className="text-muted-foreground text-xs uppercase font-medium">Notes</span>
                                    <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                                        {customer.notes}
                                    </p>
                                </div>
                            )}

                            {canManage && (
                                <div className="pt-2">
                                    <Button asChild className="w-full gap-2">
                                        <Link href={`/work-orders/create?customer_id=${customer.id}`}>
                                            <Plus className="h-4 w-4" />
                                            Create Work Order
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Columns: Locations & Recent Orders */}
                    <div className="space-y-6 md:col-span-2">
                        {/* Service Locations Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-base font-semibold">Service Locations</CardTitle>
                                    <CardDescription>
                                        Properties and job sites associated with this customer.
                                    </CardDescription>
                                </div>

                                {canManage && (
                                    <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline" className="gap-1.5">
                                                <Plus className="h-4 w-4" />
                                                Add Location
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px]">
                                            <form onSubmit={handleAddLocation}>
                                                <DialogHeader>
                                                    <DialogTitle>Add Service Location</DialogTitle>
                                                    <DialogDescription>
                                                        Add a physical site address for service dispatch.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="loc-name">Location Name / Label *</Label>
                                                        <Input
                                                            id="loc-name"
                                                            value={locationForm.data.name}
                                                            onChange={(e) => locationForm.setData('name', e.target.value)}
                                                            placeholder="e.g. Main Office, Residence, Suite 200"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="loc-addr1">Street Address *</Label>
                                                        <Input
                                                            id="loc-addr1"
                                                            value={locationForm.data.address_line1}
                                                            onChange={(e) => locationForm.setData('address_line1', e.target.value)}
                                                            placeholder="123 Commerce St"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="loc-addr2">Address Line 2</Label>
                                                        <Input
                                                            id="loc-addr2"
                                                            value={locationForm.data.address_line2}
                                                            onChange={(e) => locationForm.setData('address_line2', e.target.value)}
                                                            placeholder="Building B, Floor 2"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="loc-city">City *</Label>
                                                            <Input
                                                                id="loc-city"
                                                                value={locationForm.data.city}
                                                                onChange={(e) => locationForm.setData('city', e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="loc-state">State</Label>
                                                            <Input
                                                                id="loc-state"
                                                                value={locationForm.data.state}
                                                                onChange={(e) => locationForm.setData('state', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="loc-zip">Postal Code</Label>
                                                            <Input
                                                                id="loc-zip"
                                                                value={locationForm.data.postal_code}
                                                                onChange={(e) => locationForm.setData('postal_code', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="loc-notes">Site Access Notes</Label>
                                                        <Textarea
                                                            id="loc-notes"
                                                            value={locationForm.data.access_notes}
                                                            onChange={(e) => locationForm.setData('access_notes', e.target.value)}
                                                            placeholder="Gate codes, lockbox instructions, parking info..."
                                                            rows={2}
                                                        />
                                                    </div>
                                                </div>

                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsAddLocationOpen(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" disabled={locationForm.processing}>
                                                        Save Location
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardHeader>
                            <CardContent>
                                {serviceLocations.length === 0 ? (
                                    <div className="text-muted-foreground p-6 text-center text-sm">
                                        No service locations registered yet. Add a location to schedule jobs.
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {serviceLocations.map((loc) => (
                                            <div
                                                key={loc.id}
                                                className="border rounded-lg p-4 flex items-start justify-between bg-card hover:bg-muted/40 transition-colors"
                                            >
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-sm flex items-center gap-1.5">
                                                        <MapPin className="h-4 w-4 text-primary" />
                                                        {loc.name}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {loc.address_line1}
                                                        {loc.address_line2 ? `, ${loc.address_line2}` : ''}
                                                        {`, ${loc.city}, ${loc.state || ''} ${loc.postal_code || ''}`}
                                                    </p>
                                                    {loc.access_notes && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded mt-2">
                                                            <strong>Access:</strong> {loc.access_notes}
                                                        </p>
                                                    )}
                                                </div>

                                                {canManage && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteLocation(loc.id)}
                                                        className="text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Work Orders */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Work Order History</CardTitle>
                                <CardDescription>Latest jobs scheduled for this customer</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {recentWorkOrders.length === 0 ? (
                                    <div className="text-muted-foreground p-6 text-center text-sm">
                                        No work orders have been created for this customer yet.
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {recentWorkOrders.map((wo) => (
                                            <div
                                                key={wo.id}
                                                className="py-3 flex items-center justify-between hover:bg-muted/30 px-2 rounded-md transition-colors"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/work-orders/${wo.id}`}
                                                            className="font-semibold text-sm hover:underline text-primary"
                                                        >
                                                            {wo.order_number}: {wo.title}
                                                        </Link>
                                                        <Badge variant="outline" className="text-xs capitalize">
                                                            {wo.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-muted-foreground text-xs flex items-center gap-3">
                                                        {wo.service_location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {wo.service_location.name}
                                                            </span>
                                                        )}
                                                        {wo.assigned_worker && (
                                                            <span className="flex items-center gap-1">
                                                                <UserCheck className="h-3 w-3" />
                                                                {wo.assigned_worker.name}
                                                            </span>
                                                        )}
                                                        {wo.due_date && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                Due {new Date(wo.due_date).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/work-orders/${wo.id}`}>
                                                        View
                                                        <ChevronRight className="ml-1 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
