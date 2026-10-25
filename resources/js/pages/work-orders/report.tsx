import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    HardHat,
    MapPin,
    Phone,
    Printer,
    UserCheck,
    XCircle,
} from 'lucide-react';
import React from 'react';

interface Customer {
    id: number;
    name: string;
    email: string | null;
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
    country: string;
}

interface UserSummary {
    id: number;
    name: string;
    email: string;
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

interface StatusEvent {
    id: number;
    from_status: string;
    to_status: string;
    comment: string | null;
    created_at: string;
    user: UserSummary | null;
}

interface WorkOrder {
    id: number;
    order_number: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    due_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    customer: Customer;
    service_location: ServiceLocation | null;
    assigned_worker: UserSummary | null;
    created_by: UserSummary | null;
    checklists: Checklist[];
    evidence: Evidence[];
    status_events: StatusEvent[];
}

interface ReportProps {
    workOrder: WorkOrder;
    workspace: {
        name: string;
        email: string | null;
    };
}

export default function WorkOrderReport({ workOrder, workspace }: ReportProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white text-foreground">
            <Head title={`Completion Report - ${workOrder.order_number}`} />

            <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
                {/* Top Action Bar (hidden when printing) */}
                <div className="flex items-center justify-between print:hidden">
                    <Link
                        href={`/work-orders/${workOrder.id}`}
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        Back to Work Order
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button onClick={handlePrint} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Print / Save as PDF
                        </Button>
                    </div>
                </div>

                {/* Main Printable Document Card */}
                <div className="bg-card border rounded-2xl p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8">
                    {/* Report Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b pb-6">
                        <div>
                            <div className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
                                <FileText className="h-6 w-6" />
                                <span>{workspace.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Field Service Operations & Verification Report
                            </p>
                        </div>
                        <div className="text-left sm:text-right space-y-1">
                            <div className="font-mono text-xl font-bold text-foreground">
                                {workOrder.order_number}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Generated: {new Date().toLocaleDateString()}
                            </div>
                            <div>
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200">
                                    {workOrder.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Location Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/30 p-5 rounded-xl border">
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                Customer Information
                            </h4>
                            <div className="font-semibold text-foreground text-sm">{workOrder.customer.name}</div>
                            {workOrder.customer.company_name && (
                                <div className="text-xs text-muted-foreground">{workOrder.customer.company_name}</div>
                            )}
                            {workOrder.customer.phone && (
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{workOrder.customer.phone}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                Service Location
                            </h4>
                            {workOrder.service_location ? (
                                <div className="text-xs text-foreground space-y-0.5">
                                    <div className="font-medium">{workOrder.service_location.name}</div>
                                    <div>{workOrder.service_location.address_line1}</div>
                                    {workOrder.service_location.address_line2 && (
                                        <div>{workOrder.service_location.address_line2}</div>
                                    )}
                                    <div>
                                        {workOrder.service_location.city}, {workOrder.service_location.state || ''} {workOrder.service_location.postal_code || ''}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground italic">Standard dispatch location</div>
                            )}
                        </div>
                    </div>

                    {/* Job Scope & Timeline */}
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold text-foreground">Job Scope & Execution</h3>
                        <div className="p-4 rounded-xl border bg-card text-sm leading-relaxed whitespace-pre-line">
                            <span className="font-medium block text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Scope of Work
                            </span>
                            {workOrder.description || workOrder.title}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
                            <div className="p-3 rounded-lg border bg-muted/20">
                                <span className="text-muted-foreground block">Assigned Technician</span>
                                <span className="font-semibold text-foreground">
                                    {workOrder.assigned_worker?.name || 'Unassigned'}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg border bg-muted/20">
                                <span className="text-muted-foreground block">Created Date</span>
                                <span className="font-semibold text-foreground">
                                    {new Date(workOrder.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg border bg-muted/20">
                                <span className="text-muted-foreground block">Due Date</span>
                                <span className="font-semibold text-foreground">
                                    {workOrder.due_date ? new Date(workOrder.due_date).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg border bg-muted/20">
                                <span className="text-muted-foreground block">Completed At</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {workOrder.completed_at ? new Date(workOrder.completed_at).toLocaleString() : 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Checklist Completion Breakdown */}
                    {workOrder.checklists && workOrder.checklists.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                Completed Checklists & Verification Items
                            </h3>

                            <div className="space-y-4">
                                {workOrder.checklists.map((checklist) => (
                                    <div key={checklist.id} className="border rounded-xl overflow-hidden">
                                        <div className="bg-muted/40 px-4 py-2.5 font-semibold text-xs border-b">
                                            {checklist.name}
                                        </div>
                                        <div className="divide-y text-xs">
                                            {checklist.items.map((item) => (
                                                <div key={item.id} className="p-3 flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-2.5">
                                                        {item.is_completed ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                                        ) : (
                                                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-foreground">
                                                                {item.label}
                                                                {item.is_required && (
                                                                    <span className="text-destructive font-semibold ml-1">*</span>
                                                                )}
                                                            </div>
                                                            {item.text_response && (
                                                                <div className="text-muted-foreground mt-1 bg-muted/40 p-2 rounded border">
                                                                    <span className="font-medium">Technician Note: </span>
                                                                    {item.text_response}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {item.completed_at && (
                                                        <div className="text-[11px] text-muted-foreground shrink-0 text-right">
                                                            <div>{new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            <div>{item.completed_by?.name}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Evidence & Photo Records */}
                    {workOrder.evidence && workOrder.evidence.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Evidence & Document Records ({workOrder.evidence.length})
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {workOrder.evidence.map((evidence) => (
                                    <div key={evidence.id} className="border rounded-xl p-3 bg-card space-y-2 text-xs">
                                        <div className="font-medium truncate text-foreground">
                                            {evidence.original_filename}
                                        </div>
                                        <div className="text-muted-foreground text-[11px]">
                                            Size: {Math.round(evidence.file_size / 1024)} KB
                                        </div>
                                        {evidence.notes && (
                                            <div className="text-[11px] text-muted-foreground/90 italic">
                                                "{evidence.notes}"
                                            </div>
                                        )}
                                        <div className="text-[11px] text-muted-foreground pt-1 border-t">
                                            Uploaded by {evidence.uploader?.name || 'Technician'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sign-off & Verification Footer */}
                    <div className="pt-6 border-t space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
                            <div className="border-t-2 border-foreground/30 pt-3">
                                <div className="font-semibold text-foreground">Field Technician Signature</div>
                                <div className="text-muted-foreground mt-0.5">
                                    {workOrder.assigned_worker?.name || 'Assigned Technician'}
                                </div>
                            </div>
                            <div className="border-t-2 border-foreground/30 pt-3">
                                <div className="font-semibold text-foreground">Customer / Authorized Supervisor Sign-off</div>
                                <div className="text-muted-foreground mt-0.5">
                                    Date: {workOrder.completed_at ? new Date(workOrder.completed_at).toLocaleDateString() : '_______________'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
