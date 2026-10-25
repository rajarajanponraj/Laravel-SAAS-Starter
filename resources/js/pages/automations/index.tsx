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
import { Switch } from '@/components/ui/switch';
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
    AlertCircle,
    Bell,
    CheckCircle2,
    Clock,
    FileText,
    History,
    Mail,
    Plus,
    RefreshCw,
    Trash2,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface AutomationRule {
    id: number;
    name: string;
    trigger_event: string;
    conditions: { priority?: string } | null;
    action_type: 'send_notification' | 'create_follow_up';
    action_config: {
        subject?: string;
        recipient?: string;
        message?: string;
    };
    is_active: boolean;
    executions_count: number;
    created_at: string;
}

interface AutomationExecution {
    id: number;
    idempotency_key: string;
    status: 'pending' | 'success' | 'failed' | 'skipped';
    error_message: string | null;
    executed_at: string | null;
    created_at: string;
    rule: {
        id: number;
        name: string;
    } | null;
    work_order: {
        id: number;
        order_number: string;
        title: string;
    } | null;
}

interface AutomationsIndexProps {
    rules: {
        data: AutomationRule[];
        current_page: number;
        last_page: number;
        total: number;
    };
    recentExecutions: AutomationExecution[];
    canManage: boolean;
}

export default function AutomationsIndex({
    rules,
    recentExecutions,
    canManage,
}: AutomationsIndexProps) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'rules' | 'executions'>('rules');

    const form = useForm({
        name: '',
        trigger_event: 'work_order.overdue',
        priority_filter: 'all',
        action_type: 'send_notification',
        action_config: {
            subject: 'Overdue Work Order Alert',
            recipient: 'manager',
            message: 'A scheduled work order has passed its due date without completion.',
        },
    });

    const handleCreateRule = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            name: form.data.name,
            trigger_event: form.data.trigger_event,
            action_type: form.data.action_type,
            action_config: form.data.action_config,
        };

        if (form.data.priority_filter !== 'all') {
            payload.conditions = { priority: form.data.priority_filter };
        }

        form.post('/automations', {
            data: payload,
            onSuccess: () => {
                setCreateDialogOpen(false);
                form.reset();
            },
        });
    };

    const handleToggleRule = (ruleId: number) => {
        router.put(`/automations/${ruleId}/toggle`, {}, { preserveScroll: true });
    };

    const handleDeleteRule = (ruleId: number) => {
        if (confirm('Delete this automation rule?')) {
            router.delete(`/automations/${ruleId}`);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Automations', href: '/automations' },
    ];

    const getTriggerLabel = (event: string) => {
        switch (event) {
            case 'work_order.overdue':
                return 'Overdue Work Order';
            case 'work_order.assigned':
                return 'Worker Assigned';
            case 'work_order.submitted':
                return 'Job Submitted for Review';
            case 'work_order.approved':
                return 'Supervisor Approved';
            case 'work_order.changes_requested':
                return 'Changes Requested';
            default:
                return event;
        }
    };

    const getStatusBadge = (status: AutomationExecution['status']) => {
        switch (status) {
            case 'success':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-xs">Success</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="text-xs">Failed</Badge>;
            case 'skipped':
                return <Badge variant="secondary" className="text-xs">Skipped</Badge>;
            default:
                return <Badge variant="outline" className="text-xs">Pending</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Automations & Notifications - CrewFlow" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <Zap className="h-5 w-5" />
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                Automations & Workflows
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Trigger automatic alerts, notifications, and follow-up work orders based on job lifecycle events.
                        </p>
                    </div>

                    {canManage && (
                        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Rule
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b">
                    <button
                        type="button"
                        onClick={() => setActiveTab('rules')}
                        className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'rules'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Zap className="h-4 w-4" />
                        <span>Active Rules ({rules.total})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('executions')}
                        className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'executions'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <History className="h-4 w-4" />
                        <span>Execution History ({recentExecutions.length})</span>
                    </button>
                </div>

                {/* Tab 1: Rules */}
                {activeTab === 'rules' && (
                    <>
                        {rules.data.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <div className="p-3 bg-muted rounded-full mb-3">
                                        <Zap className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground">No Automation Rules Configured</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                                        Set up rules to automatically alert dispatchers when jobs are overdue or notify technicians when assignments arrive.
                                    </p>
                                    {canManage && (
                                        <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Create First Automation
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rules.data.map((rule) => (
                                    <Card key={rule.id} className="flex flex-col justify-between">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-base font-semibold text-foreground">
                                                        {rule.name}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 pt-0.5">
                                                        <Badge variant="outline" className="text-xs">
                                                            {getTriggerLabel(rule.trigger_event)}
                                                        </Badge>
                                                        {rule.conditions?.priority && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Priority: {rule.conditions.priority}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {canManage && (
                                                    <Switch
                                                        checked={rule.is_active}
                                                        onCheckedChange={() => handleToggleRule(rule.id)}
                                                    />
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-3 pt-0">
                                            <div className="bg-muted/30 rounded-lg p-2.5 text-xs text-muted-foreground space-y-1">
                                                <div className="flex items-center gap-1.5 text-foreground font-medium">
                                                    {rule.action_type === 'send_notification' ? (
                                                        <Mail className="h-3.5 w-3.5 text-primary" />
                                                    ) : (
                                                        <FileText className="h-3.5 w-3.5 text-primary" />
                                                    )}
                                                    <span>
                                                        {rule.action_type === 'send_notification'
                                                            ? `Email Notification to ${rule.action_config.recipient || 'manager'}`
                                                            : 'Create 14-day Follow-up Work Order'}
                                                    </span>
                                                </div>
                                                {rule.action_config.subject && (
                                                    <div className="text-[11px] truncate">
                                                        Subject: "{rule.action_config.subject}"
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between text-xs pt-1 border-t text-muted-foreground">
                                                <span>{rule.executions_count} executions</span>
                                                {canManage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                        className="text-muted-foreground hover:text-destructive text-xs"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Tab 2: Execution History Log */}
                {activeTab === 'executions' && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Recent Execution Audit Trail</CardTitle>
                            <CardDescription>
                                Idempotent execution logs tracking automated actions and delivery states.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentExecutions.length === 0 ? (
                                <p className="p-6 text-xs text-muted-foreground italic text-center">
                                    No automation execution logs recorded yet.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs">Status</TableHead>
                                            <TableHead className="text-xs">Rule Name</TableHead>
                                            <TableHead className="text-xs">Work Order</TableHead>
                                            <TableHead className="text-xs">Idempotency Key</TableHead>
                                            <TableHead className="text-xs">Executed At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentExecutions.map((exec) => (
                                            <TableRow key={exec.id}>
                                                <TableCell>{getStatusBadge(exec.status)}</TableCell>
                                                <TableCell className="text-xs font-medium">
                                                    {exec.rule?.name || 'Rule'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {exec.work_order ? (
                                                        <Link
                                                            href={`/work-orders/${exec.work_order.id}`}
                                                            className="text-primary hover:underline font-mono"
                                                        >
                                                            {exec.work_order.order_number}
                                                        </Link>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px]">
                                                    {exec.idempotency_key}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {exec.executed_at
                                                        ? new Date(exec.executed_at).toLocaleString()
                                                        : new Date(exec.created_at).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Create Rule Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Create Automation Rule
                        </DialogTitle>
                        <DialogDescription>
                            Configure when an automated action should trigger for work orders.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateRule} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rule_name">Rule Name</Label>
                            <Input
                                id="rule_name"
                                placeholder="E.g., Notify Manager on Overdue Jobs"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                required
                            />
                            {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="trigger_event">Trigger Event</Label>
                                <Select
                                    value={form.data.trigger_event}
                                    onValueChange={(val) => form.setData('trigger_event', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="work_order.overdue">Work Order Overdue</SelectItem>
                                        <SelectItem value="work_order.assigned">Technician Assigned</SelectItem>
                                        <SelectItem value="work_order.submitted">Submitted for Review</SelectItem>
                                        <SelectItem value="work_order.approved">Supervisor Approved</SelectItem>
                                        <SelectItem value="work_order.changes_requested">Changes Requested</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority_filter">Condition: Priority</Label>
                                <Select
                                    value={form.data.priority_filter}
                                    onValueChange={(val) => form.setData('priority_filter', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any Priority</SelectItem>
                                        <SelectItem value="urgent">Urgent Priority Only</SelectItem>
                                        <SelectItem value="high">High Priority Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="action_type">Action</Label>
                            <Select
                                value={form.data.action_type}
                                onValueChange={(val: any) => form.setData('action_type', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="send_notification">Send Email Notification</SelectItem>
                                    <SelectItem value="create_follow_up">Create Follow-up Work Order (14 Days)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {form.data.action_type === 'send_notification' && (
                            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="recipient">Recipient</Label>
                                    <Select
                                        value={form.data.action_config.recipient}
                                        onValueChange={(val) =>
                                            form.setData('action_config', {
                                                ...form.data.action_config,
                                                recipient: val,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manager">Workspace Owner / Dispatcher</SelectItem>
                                            <SelectItem value="worker">Assigned Field Technician</SelectItem>
                                            <SelectItem value="customer">Customer Email</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Email Subject</Label>
                                    <Input
                                        id="subject"
                                        className="h-9 text-xs"
                                        value={form.data.action_config.subject}
                                        onChange={(e) =>
                                            form.setData('action_config', {
                                                ...form.data.action_config,
                                                subject: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message Body</Label>
                                    <Textarea
                                        id="message"
                                        rows={2}
                                        className="text-xs"
                                        value={form.data.action_config.message}
                                        onChange={(e) =>
                                            form.setData('action_config', {
                                                ...form.data.action_config,
                                                message: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing || !form.data.name.trim()}>
                                Save Automation Rule
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
