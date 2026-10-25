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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    ChevronRight,
    ClipboardList,
    Mail,
    MapPin,
    Phone,
    Plus,
    Search,
    UserCheck,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    notes: string | null;
    status: 'active' | 'archived';
    service_locations_count?: number;
    work_orders_count?: number;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface CustomersProps {
    customers: {
        data: Customer[];
        current_page: number;
        last_page: number;
        total: number;
        links: PaginationLink[];
    };
    filters: {
        search: string;
        status: string;
    };
    canManage: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Customers', href: '/customers' },
];

export default function CustomersIndex({ customers, filters, canManage }: CustomersProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'active');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        company_name: '',
        email: '',
        phone: '',
        notes: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/customers',
            { search, status: statusFilter },
            { preserveState: true, replace: true }
        );
    };

    const handleStatusChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        router.get(
            '/customers',
            { search, status: newStatus },
            { preserveState: true, replace: true }
        );
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/customers', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers & Accounts - CrewFlow" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Customers & Accounts</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage your client database, service locations, and job histories.
                        </p>
                    </div>

                    {canManage && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Customer
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <form onSubmit={handleCreateSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>New Customer Account</DialogTitle>
                                        <DialogDescription>
                                            Add client contact details and company information.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Primary Contact Name *</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g. Sarah Jenkins"
                                                required
                                            />
                                            {errors.name && (
                                                <p className="text-xs text-destructive">{errors.name}</p>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="company_name">Company Name (Optional)</Label>
                                            <Input
                                                id="company_name"
                                                value={data.company_name}
                                                onChange={(e) => setData('company_name', e.target.value)}
                                                placeholder="e.g. Oakridge Properties LLC"
                                            />
                                            {errors.company_name && (
                                                <p className="text-xs text-destructive">{errors.company_name}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    placeholder="sarah@example.com"
                                                />
                                                {errors.email && (
                                                    <p className="text-xs text-destructive">{errors.email}</p>
                                                )}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input
                                                    id="phone"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    placeholder="(555) 234-5678"
                                                />
                                                {errors.phone && (
                                                    <p className="text-xs text-destructive">{errors.phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="notes">Internal Notes</Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Billing requirements, preferred communication channels..."
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Saving...' : 'Create Customer'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <form onSubmit={handleSearch} className="relative flex-1">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name, company, email or phone..."
                                    className="pl-9"
                                />
                            </form>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant={statusFilter === 'active' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusChange('active')}
                                >
                                    Active
                                </Button>
                                <Button
                                    variant={statusFilter === 'archived' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusChange('archived')}
                                >
                                    Archived
                                </Button>
                                <Button
                                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusChange('all')}
                                >
                                    All
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Table */}
                <Card>
                    <CardHeader className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">
                                Customers ({customers.total})
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {customers.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Users className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
                                <h3 className="text-lg font-medium">No customers found</h3>
                                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                                    {search
                                        ? 'No customers matched your search query. Try clearing the filters.'
                                        : 'Get started by creating your first customer account.'}
                                </p>
                                {canManage && !search && (
                                    <Button
                                        onClick={() => setIsCreateOpen(true)}
                                        className="mt-4 gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add First Customer
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Contact Information</TableHead>
                                        <TableHead className="text-center">Locations</TableHead>
                                        <TableHead className="text-center">Work Orders</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.data.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={`/customers/${customer.id}`}
                                                        className="font-medium hover:underline text-primary"
                                                    >
                                                        {customer.name}
                                                    </Link>
                                                    {customer.company_name && (
                                                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                                            <Building2 className="h-3 w-3" />
                                                            {customer.company_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    {customer.email && (
                                                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                                            <Mail className="h-3 w-3" />
                                                            {customer.email}
                                                        </span>
                                                    )}
                                                    {customer.phone && (
                                                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                                            <Phone className="h-3 w-3" />
                                                            {customer.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                <span className="inline-flex items-center gap-1 text-xs">
                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                    {customer.service_locations_count ?? 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                <span className="inline-flex items-center gap-1 text-xs">
                                                    <ClipboardList className="h-3 w-3 text-muted-foreground" />
                                                    {customer.work_orders_count ?? 0}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={customer.status === 'active' ? 'default' : 'secondary'}
                                                >
                                                    {customer.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/customers/${customer.id}`}>
                                                        View Details
                                                        <ChevronRight className="ml-1 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {customers.last_page > 1 && (
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="text-muted-foreground text-sm">
                            Showing page {customers.current_page} of {customers.last_page}
                        </div>
                        <div className="flex gap-1">
                            {customers.links.map((link, idx) => (
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
