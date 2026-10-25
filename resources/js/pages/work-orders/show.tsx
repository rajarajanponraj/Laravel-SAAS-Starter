import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    Camera,
    CheckCircle2,
    Clock,
    Download,
    Edit3,
    ExternalLink,
    FileText,
    HardHat,
    History,
    ListChecks,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Play,
    Plus,
    Printer,
    Send,
    Trash2,
    UploadCloud,
    UserCheck,
    UserPlus,
    XCircle,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    notes: string | null;
}

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

interface UserSummary {
    id: number;
    name: string;
    email: string;
}

interface StatusEvent {
    id: number;
    from_status: string;
    to_status: string;
    comment: string | null;
    created_at: string;
    user: UserSummary | null;
}

interface Assignment {
    id: number;
    assigned_at: string;
    notes: string | null;
    worker: UserSummary | null;
    assigned_by: UserSummary | null;
}

interface ChecklistItem {
    id: number;
    label: string;
    type: string;
    is_required: boolean;
    is_completed: boolean;
    completed_at: string | null;
    text_response: string | null;
    completed_by: UserSummary | null;
}

interface Checklist {
    id: number;
    name: string;
    items: ChecklistItem[];
}

interface Evidence {
    id: number;
    original_filename: string;
    storage_path: string;
    mime_type: string;
    file_size: number;
    notes: string | null;
    created_at: string;
    uploader: UserSummary | null;
}

interface TemplateSummary {
    id: number;
    name: string;
    description: string | null;
}

interface WorkOrder {
    id: number;
    order_number: string;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'draft' | 'assigned' | 'in_progress' | 'submitted' | 'changes_requested' | 'completed' | 'cancelled';
    due_date: string | null;
    scheduled_start_at: string | null;
    scheduled_end_at: string | null;
    started_at: string | null;
    submitted_at: string | null;
    completed_at: string | null;
    created_at: string;
    customer: Customer;
    service_location: ServiceLocation | null;
    assigned_worker: UserSummary | null;
    created_by: UserSummary | null;
    status_events: StatusEvent[];
    assignments: Assignment[];
    checklists: Checklist[];
    evidence: Evidence[];
}

interface WorkOrderShowProps {
    workOrder: WorkOrder;
    workers: UserSummary[];
    availableTemplates: TemplateSummary[];
    canManage: boolean;
    isAssignedWorker: boolean;
    userRole: string;
}

export default function WorkOrderShow({
    workOrder,
    workers,
    availableTemplates = [],
    canManage,
    isAssignedWorker,
    userRole,
}: WorkOrderShowProps) {
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [changesDialogOpen, setChangesDialogOpen] = useState(false);
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const [attachChecklistDialogOpen, setAttachChecklistDialogOpen] = useState(false);
    const [uploadEvidenceDialogOpen, setUploadEvidenceDialogOpen] = useState(false);

    // Assignment Form
    const assignForm = useForm({
        user_id: workOrder.assigned_worker ? String(workOrder.assigned_worker.id) : '',
        notes: '',
    });

    // Attach Checklist Form
    const attachChecklistForm = useForm({
        checklist_template_id: '',
    });

    // Evidence Upload Form
    const evidenceForm = useForm<{
        file: File | null;
        notes: string;
    }>({
        file: null,
        notes: '',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Status Transition Forms
    const statusForm = useForm<{
        to_status: string;
        comment: string;
    }>({
        to_status: '',
        comment: '',
    });

    const handleAssignWorker = (e: React.FormEvent) => {
        e.preventDefault();
        assignForm.post(`/work-orders/${workOrder.id}/assign`, {
            onSuccess: () => {
                setAssignDialogOpen(false);
                assignForm.reset();
            },
        });
    };

    const handleAttachChecklist = (e: React.FormEvent) => {
        e.preventDefault();
        attachChecklistForm.post(`/work-orders/${workOrder.id}/checklists`, {
            onSuccess: () => {
                setAttachChecklistDialogOpen(false);
                attachChecklistForm.reset();
            },
        });
    };

    const handleUploadEvidence = (e: React.FormEvent) => {
        e.preventDefault();
        evidenceForm.post(`/work-orders/${workOrder.id}/evidence`, {
            forceFormData: true,
            onSuccess: () => {
                setUploadEvidenceDialogOpen(false);
                evidenceForm.reset();
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const handleToggleChecklistItem = (item: ChecklistItem) => {
        router.put(
            `/work-orders/${workOrder.id}/checklists/items/${item.id}`,
            {
                is_completed: !item.is_completed,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const handleSaveTextResponse = (itemId: number, text: string) => {
        router.put(
            `/work-orders/${workOrder.id}/checklists/items/${itemId}`,
            {
                text_response: text,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const handleDeleteEvidence = (evidenceId: number) => {
        if (confirm('Delete this evidence file?')) {
            router.delete(`/work-orders/${workOrder.id}/evidence/${evidenceId}`, {
                preserveScroll: true,
            });
        }
    };

    const handleTransitionStatus = (toStatus: string, comment: string = '') => {
        router.put(
            `/work-orders/${workOrder.id}/status`,
            {
                to_status: toStatus,
                comment,
            },
            {
                onSuccess: () => {
                    setChangesDialogOpen(false);
                    setSubmitDialogOpen(false);
                    statusForm.reset();
                },
            },
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Work Orders', href: '/work-orders' },
        { title: workOrder.order_number, href: `/work-orders/${workOrder.id}` },
    ];

    const getStatusBadge = (status: WorkOrder['status']) => {
        switch (status) {
            case 'draft':
                return <Badge variant="secondary">Draft</Badge>;
            case 'assigned':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200">Assigned</Badge>;
            case 'in_progress':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200">In Progress</Badge>;
            case 'submitted':
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200">Submitted for Review</Badge>;
            case 'changes_requested':
                return <Badge variant="destructive">Changes Requested</Badge>;
            case 'completed':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200">Completed</Badge>;
            case 'cancelled':
                return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: WorkOrder['priority']) => {
        switch (priority) {
            case 'urgent':
                return <Badge variant="destructive" className="animate-pulse">Urgent Priority</Badge>;
            case 'high':
                return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200">High Priority</Badge>;
            case 'medium':
                return <Badge variant="secondary">Medium Priority</Badge>;
            case 'low':
                return <Badge variant="outline" className="text-muted-foreground">Low Priority</Badge>;
        }
    };

    // Find the latest changes_requested comment if currently in changes_requested status
    const latestChangesRequestedEvent = workOrder.status === 'changes_requested'
        ? workOrder.status_events.find((e) => e.to_status === 'changes_requested')
        : null;

    // Count incomplete required checklist items
    const requiredChecklistItems = (workOrder.checklists || []).flatMap((c) => c.items.filter((i) => i.is_required));
    const incompleteRequiredCount = requiredChecklistItems.filter((i) => !i.is_completed).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${workOrder.order_number} - ${workOrder.title}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Back Link & Quick Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link
                                href="/work-orders"
                                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                All Work Orders
                            </Link>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-mono text-sm font-semibold">{workOrder.order_number}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            {workOrder.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {getStatusBadge(workOrder.status)}
                            {getPriorityBadge(workOrder.priority)}
                            {workOrder.due_date && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Due: {new Date(workOrder.due_date).toLocaleDateString()}</span>
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Completion Report Button */}
                        <Button asChild variant="outline" className="gap-2">
                            <Link href={`/work-orders/${workOrder.id}/report`}>
                                <FileText className="h-4 w-4" />
                                Report
                            </Link>
                        </Button>

                        {canManage && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setAssignDialogOpen(true)}
                                    className="gap-2"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    {workOrder.assigned_worker ? 'Reassign' : 'Assign Worker'}
                                </Button>
                                <Button asChild variant="outline" className="gap-2">
                                    <Link href={`/work-orders/${workOrder.id}/edit`}>
                                        <Edit3 className="h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                            </>
                        )}

                        {/* Worker Action: Start Work */}
                        {isAssignedWorker && workOrder.status === 'assigned' && (
                            <Button
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleTransitionStatus('in_progress', 'Technician started work')}
                            >
                                <Play className="h-4 w-4" />
                                Start Work
                            </Button>
                        )}

                        {/* Worker Action: Submit for Review */}
                        {isAssignedWorker && ['in_progress', 'changes_requested'].includes(workOrder.status) && (
                            <Button
                                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => setSubmitDialogOpen(true)}
                            >
                                <Send className="h-4 w-4" />
                                Submit for Review
                            </Button>
                        )}

                        {/* Dispatcher/Supervisor Review Actions: Approve / Request Changes */}
                        {canManage && workOrder.status === 'submitted' && (
                            <>
                                <Button
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={() => setChangesDialogOpen(true)}
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    Request Changes
                                </Button>
                                <Button
                                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleTransitionStatus('completed', 'Work verified and approved by supervisor.')}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve & Complete
                                </Button>
                            </>
                        )}

                        {/* Manager Cancel Action */}
                        {canManage && !['completed', 'cancelled'].includes(workOrder.status) && (
                            <Button
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                    if (confirm('Are you sure you want to cancel this work order?')) {
                                        handleTransitionStatus('cancelled', 'Work order cancelled by administrator.');
                                    }
                                }}
                            >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel Job
                            </Button>
                        )}
                    </div>
                </div>

                {/* Prominent Banner if Changes Requested */}
                {workOrder.status === 'changes_requested' && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:p-5 flex items-start gap-4">
                        <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                            <h3 className="font-semibold text-destructive text-base">Changes Requested by Reviewer</h3>
                            <p className="text-sm text-foreground/90">
                                {latestChangesRequestedEvent?.comment || 'The supervisor requested updates before this job can be completed. Please review notes and resubmit.'}
                            </p>
                            {latestChangesRequestedEvent?.user && (
                                <p className="text-xs text-muted-foreground pt-1">
                                    Requested by {latestChangesRequestedEvent.user.name} on{' '}
                                    {new Date(latestChangesRequestedEvent.created_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Two-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content (2 Columns) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Work Order Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Job Description & Scope</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {workOrder.description ? (
                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                                        {workOrder.description}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No detailed scope provided.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Checklists & Field Verification Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ListChecks className="h-5 w-5 text-primary" />
                                        Task & Quality Checklists
                                    </CardTitle>
                                    <CardDescription>
                                        Required inspection items must be checked before submission.
                                    </CardDescription>
                                </div>
                                {canManage && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-1.5 text-xs"
                                        onClick={() => setAttachChecklistDialogOpen(true)}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Attach Template
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {workOrder.checklists && workOrder.checklists.length > 0 ? (
                                    workOrder.checklists.map((checklist) => (
                                        <div key={checklist.id} className="border rounded-xl overflow-hidden">
                                            <div className="bg-muted/30 px-4 py-2.5 font-semibold text-xs border-b flex items-center justify-between">
                                                <span>{checklist.name}</span>
                                                <span className="text-muted-foreground font-normal">
                                                    {checklist.items.filter((i) => i.is_completed).length} / {checklist.items.length} completed
                                                </span>
                                            </div>

                                            <div className="divide-y text-xs">
                                                {checklist.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-muted/10 transition-colors"
                                                    >
                                                        <div className="flex items-start gap-2.5 flex-1">
                                                            <Checkbox
                                                                id={`item_${item.id}`}
                                                                checked={item.is_completed}
                                                                onCheckedChange={() => handleToggleChecklistItem(item)}
                                                                className="mt-0.5"
                                                            />
                                                            <div className="space-y-1 flex-1">
                                                                <Label
                                                                    htmlFor={`item_${item.id}`}
                                                                    className={`font-medium cursor-pointer ${
                                                                        item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                                                                    }`}
                                                                >
                                                                    {item.label}
                                                                </Label>
                                                                {item.is_required && !item.is_completed && (
                                                                    <Badge variant="destructive" className="ml-2 text-[10px] py-0 px-1">
                                                                        Required
                                                                    </Badge>
                                                                )}

                                                                {item.type === 'text' && (
                                                                    <div className="pt-1.5 flex gap-2">
                                                                        <Input
                                                                            defaultValue={item.text_response || ''}
                                                                            placeholder="Enter note or measurement..."
                                                                            className="h-8 text-xs"
                                                                            onBlur={(e) => handleSaveTextResponse(item.id, e.target.value)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {item.completed_at && (
                                                            <div className="text-[11px] text-muted-foreground shrink-0 sm:text-right pl-6 sm:pl-0">
                                                                <div>Done by {item.completed_by?.name || 'Worker'}</div>
                                                                <div>{new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 rounded-lg border border-dashed text-center space-y-2">
                                        <p className="text-xs text-muted-foreground">No checklists attached to this work order.</p>
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs"
                                                onClick={() => setAttachChecklistDialogOpen(true)}
                                            >
                                                Attach Standard Template
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Evidence & Photo Records Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Camera className="h-5 w-5 text-primary" />
                                        Evidence & Photo Records
                                    </CardTitle>
                                    <CardDescription>
                                        Photos and documentation uploaded from the field.
                                    </CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1.5 text-xs"
                                    onClick={() => setUploadEvidenceDialogOpen(true)}
                                >
                                    <UploadCloud className="h-3.5 w-3.5" />
                                    Upload Photo/File
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {workOrder.evidence && workOrder.evidence.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {workOrder.evidence.map((ev) => (
                                            <div
                                                key={ev.id}
                                                className="border rounded-xl p-3 bg-muted/20 flex flex-col justify-between space-y-2 text-xs"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="font-medium text-foreground truncate">
                                                        {ev.original_filename}
                                                    </div>
                                                    <a
                                                        href={`/work-orders/${workOrder.id}/evidence/${ev.id}?download=1`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-muted-foreground hover:text-foreground p-1"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                    </a>
                                                </div>

                                                {ev.notes && (
                                                    <div className="text-[11px] text-muted-foreground italic">
                                                        "{ev.notes}"
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-1 border-t text-[11px] text-muted-foreground">
                                                    <span>By: {ev.uploader?.name || 'Technician'}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span>{Math.round(ev.file_size / 1024)} KB</span>
                                                        {canManage && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteEvidence(ev.id)}
                                                                className="text-destructive hover:underline"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-lg border border-dashed text-center space-y-2">
                                        <p className="text-xs text-muted-foreground">No evidence photos or documents uploaded yet.</p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs gap-1.5"
                                            onClick={() => setUploadEvidenceDialogOpen(true)}
                                        >
                                            <Camera className="h-3.5 w-3.5" />
                                            Capture / Upload First Photo
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Customer & Location Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Customer Card */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        Customer Contact
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div>
                                        <div className="font-semibold text-foreground">{workOrder.customer.name}</div>
                                        {workOrder.customer.company_name && (
                                            <div className="text-xs text-muted-foreground">{workOrder.customer.company_name}</div>
                                        )}
                                    </div>
                                    <div className="pt-2 space-y-1.5">
                                        {workOrder.customer.phone && (
                                            <a
                                                href={`tel:${workOrder.customer.phone}`}
                                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                                            >
                                                <Phone className="h-3.5 w-3.5 text-primary" />
                                                <span>{workOrder.customer.phone}</span>
                                            </a>
                                        )}
                                        {workOrder.customer.email && (
                                            <a
                                                href={`mailto:${workOrder.customer.email}`}
                                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground truncate"
                                            >
                                                <Mail className="h-3.5 w-3.5 text-primary" />
                                                <span className="truncate">{workOrder.customer.email}</span>
                                            </a>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Service Location Card */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        Service Location
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    {workOrder.service_location ? (
                                        <>
                                            <div className="font-semibold text-foreground">{workOrder.service_location.name}</div>
                                            <div className="text-muted-foreground text-xs leading-relaxed">
                                                <div>{workOrder.service_location.address_line1}</div>
                                                {workOrder.service_location.address_line2 && (
                                                    <div>{workOrder.service_location.address_line2}</div>
                                                )}
                                                <div>
                                                    {workOrder.service_location.city}
                                                    {workOrder.service_location.state ? `, ${workOrder.service_location.state}` : ''}{' '}
                                                    {workOrder.service_location.postal_code || ''}
                                                </div>
                                            </div>
                                            {workOrder.service_location.access_notes && (
                                                <div className="p-2 bg-muted/60 rounded text-xs mt-2 text-foreground">
                                                    <span className="font-medium">Access: </span>
                                                    {workOrder.service_location.access_notes}
                                                </div>
                                            )}
                                            <div className="pt-2">
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                        `${workOrder.service_location.address_line1}, ${workOrder.service_location.city} ${workOrder.service_location.state || ''}`,
                                                    )}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    Open Directions in Maps
                                                </a>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-muted-foreground text-xs italic">
                                            No specific service address registered.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Status Events / Audit Trail */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <History className="h-5 w-5 text-muted-foreground" />
                                    Job Activity & Status Trail
                                </CardTitle>
                                <CardDescription>Complete lifecycle transition audit for this work order.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {workOrder.status_events.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No status transitions recorded yet.</p>
                                ) : (
                                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted-foreground/20">
                                        {workOrder.status_events.map((event) => (
                                            <div key={event.id} className="relative group">
                                                <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                                        <span>Status updated to</span>
                                                        {getStatusBadge(event.to_status as WorkOrder['status'])}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {new Date(event.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground pt-0.5">
                                                    Action by: {event.user?.name || 'System / Auto'}
                                                </div>
                                                {event.comment && (
                                                    <div className="mt-2 text-xs bg-muted/50 p-2.5 rounded-lg border border-border/50 text-foreground flex items-start gap-2">
                                                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                        <span>{event.comment}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column / Sidebar Info */}
                    <div className="space-y-6">
                        {/* Worker Assignment Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <HardHat className="h-4 w-4 text-primary" />
                                    Assigned Field Technician
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {workOrder.assigned_worker ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                                            {workOrder.assigned_worker.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-semibold text-foreground">
                                                {workOrder.assigned_worker.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {workOrder.assigned_worker.email}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-center">
                                        <UserPlus className="h-6 w-6 text-muted-foreground mb-1" />
                                        <p className="text-xs text-muted-foreground">No worker assigned</p>
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-3 text-xs"
                                                onClick={() => setAssignDialogOpen(true)}
                                            >
                                                Assign Now
                                            </Button>
                                        )}
                                    </div>
                                )}

                                <Separator />

                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Created by</span>
                                        <span className="font-medium text-foreground">{workOrder.created_by?.name || 'Dispatcher'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Created at</span>
                                        <span className="font-medium text-foreground">
                                            {new Date(workOrder.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {workOrder.started_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Started at</span>
                                            <span className="font-medium text-foreground">
                                                {new Date(workOrder.started_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    {workOrder.completed_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Completed at</span>
                                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                {new Date(workOrder.completed_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Assignment History */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-primary" />
                                    Assignment Log
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {workOrder.assignments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No previous assignments recorded.</p>
                                ) : (
                                    <div className="space-y-3 text-xs">
                                        {workOrder.assignments.map((assignment) => (
                                            <div key={assignment.id} className="p-2.5 rounded border border-border/60 bg-muted/20">
                                                <div className="font-medium text-foreground">
                                                    {assignment.worker?.name || 'Worker'}
                                                </div>
                                                <div className="text-muted-foreground mt-0.5">
                                                    Assigned by {assignment.assigned_by?.name || 'Dispatcher'}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground/80 mt-1">
                                                    {new Date(assignment.assigned_at).toLocaleString()}
                                                </div>
                                                {assignment.notes && (
                                                    <div className="mt-1.5 text-xs text-foreground bg-background p-1.5 rounded border">
                                                        {assignment.notes}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Attach Checklist Dialog */}
            <Dialog open={attachChecklistDialogOpen} onOpenChange={setAttachChecklistDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Attach Checklist Template</DialogTitle>
                        <DialogDescription>
                            Select a quality checklist template to instantiate on this work order.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAttachChecklist} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="template_select">Choose Template</Label>
                            <Select
                                value={attachChecklistForm.data.checklist_template_id}
                                onValueChange={(val) => attachChecklistForm.setData('checklist_template_id', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTemplates.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {attachChecklistForm.errors.checklist_template_id && (
                                <p className="text-xs text-destructive">{attachChecklistForm.errors.checklist_template_id}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAttachChecklistDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={attachChecklistForm.processing || !attachChecklistForm.data.checklist_template_id}>
                                Attach Checklist
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Upload Evidence Dialog */}
            <Dialog open={uploadEvidenceDialogOpen} onOpenChange={setUploadEvidenceDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-primary" />
                            Upload Site Evidence / Document
                        </DialogTitle>
                        <DialogDescription>
                            Upload photos or service PDF documents (Max 10MB per file).
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUploadEvidence} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="evidence_file">Select File or Camera Photo</Label>
                            <Input
                                id="evidence_file"
                                type="file"
                                ref={fileInputRef}
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={(e) => evidenceForm.setData('file', e.target.files?.[0] || null)}
                                required
                            />
                            {evidenceForm.errors.file && (
                                <p className="text-xs text-destructive">{evidenceForm.errors.file}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="evidence_notes">Description / Notes (Optional)</Label>
                            <Textarea
                                id="evidence_notes"
                                rows={2}
                                placeholder="E.g., Before repair photo, serial number label..."
                                value={evidenceForm.data.notes}
                                onChange={(e) => evidenceForm.setData('notes', e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setUploadEvidenceDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={evidenceForm.processing || !evidenceForm.data.file}>
                                Upload File
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Assign Worker Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Field Worker</DialogTitle>
                        <DialogDescription>
                            Assign a technician or team member to {workOrder.order_number}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignWorker} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="worker_id">Select Technician</Label>
                            <Select
                                value={assignForm.data.user_id}
                                onValueChange={(val) => assignForm.setData('user_id', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a worker..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {workers.map((w) => (
                                        <SelectItem key={w.id} value={String(w.id)}>
                                            {w.name} ({w.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {assignForm.errors.user_id && (
                                <p className="text-xs text-destructive">{assignForm.errors.user_id}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assign_notes">Assignment Notes (Optional)</Label>
                            <Textarea
                                id="assign_notes"
                                placeholder="Special instructions for this technician..."
                                value={assignForm.data.notes}
                                onChange={(e) => assignForm.setData('notes', e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAssignDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={assignForm.processing || !assignForm.data.user_id}>
                                Confirm Assignment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Request Changes Dialog */}
            <Dialog open={changesDialogOpen} onOpenChange={setChangesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Request Changes from Technician
                        </DialogTitle>
                        <DialogDescription>
                            Describe the corrections or missing evidence required before this job can be approved.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="changes_comment">Supervisor Feedback & Required Fixes</Label>
                            <Textarea
                                id="changes_comment"
                                rows={4}
                                placeholder="E.g., Missing close-up photo of filter serial number, checklist item #3 requires photo confirmation..."
                                value={statusForm.data.comment}
                                onChange={(e) => statusForm.setData('comment', e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setChangesDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={!statusForm.data.comment.trim()}
                                onClick={() => handleTransitionStatus('changes_requested', statusForm.data.comment)}
                            >
                                Send Changes Request
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Submit for Review Dialog */}
            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-purple-600" />
                            Submit Work for Supervisor Review
                        </DialogTitle>
                        <DialogDescription>
                            Confirm that you have completed all assigned work and documented necessary notes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {incompleteRequiredCount > 0 && (
                            <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>
                                    Warning: You have {incompleteRequiredCount} incomplete required checklist item(s).
                                </span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="submit_comment">Completion Summary / Notes (Optional)</Label>
                            <Textarea
                                id="submit_comment"
                                rows={3}
                                placeholder="Work completed according to specifications. Site cleaned and customer signed off."
                                value={statusForm.data.comment}
                                onChange={(e) => statusForm.setData('comment', e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSubmitDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => handleTransitionStatus('submitted', statusForm.data.comment)}
                            >
                                Confirm & Submit
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
