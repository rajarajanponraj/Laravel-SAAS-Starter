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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    CheckSquare,
    ListChecks,
    Plus,
    Trash2,
} from 'lucide-react';
import React, { useState } from 'react';

interface TemplateItem {
    id: number;
    label: string;
    description: string | null;
    type: 'checkbox' | 'text' | 'number';
    is_required: boolean;
    sort_order: number;
}

interface Template {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    items: TemplateItem[];
    created_at: string;
}

interface ChecklistsIndexProps {
    templates: {
        data: Template[];
        current_page: number;
        last_page: number;
        total: number;
    };
    canManage: boolean;
}

export default function ChecklistsIndex({ templates, canManage }: ChecklistsIndexProps) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const form = useForm({
        name: '',
        description: '',
        items: [
            { label: '', description: '', type: 'checkbox', is_required: true, sort_order: 1 },
        ],
    });

    const addItem = () => {
        form.setData('items', [
            ...form.data.items,
            {
                label: '',
                description: '',
                type: 'checkbox',
                is_required: false,
                sort_order: form.data.items.length + 1,
            },
        ]);
    };

    const removeItem = (index: number) => {
        const nextItems = form.data.items.filter((_, i) => i !== index);
        form.setData('items', nextItems);
    };

    const updateItemField = (index: number, field: string, value: any) => {
        const nextItems = [...form.data.items];
        nextItems[index] = { ...nextItems[index], [field]: value };
        form.setData('items', nextItems);
    };

    const handleCreateTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/checklist-templates', {
            onSuccess: () => {
                setCreateDialogOpen(false);
                form.reset();
            },
        });
    };

    const handleDeleteTemplate = (templateId: number) => {
        if (confirm('Are you sure you want to delete this checklist template?')) {
            router.delete(`/checklist-templates/${templateId}`);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Checklists', href: '/checklist-templates' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Checklist Templates - CrewFlow" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <ListChecks className="h-5 w-5" />
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                Checklist Templates
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Standard operating procedures, safety audits, and required quality checklists for work orders.
                        </p>
                    </div>

                    {canManage && (
                        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Template
                        </Button>
                    )}
                </div>

                {/* Templates Grid */}
                {templates.data.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="p-3 bg-muted rounded-full mb-3">
                                <CheckSquare className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">No Checklist Templates</h3>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                                Create reusable templates with required and optional verification items to attach to work orders.
                            </p>
                            {canManage && (
                                <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create First Template
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {templates.data.map((template) => (
                            <Card key={template.id} className="flex flex-col justify-between">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {template.name}
                                        </CardTitle>
                                        <Badge variant="outline" className="text-xs">
                                            {template.items.length} items
                                        </Badge>
                                    </div>
                                    {template.description && (
                                        <CardDescription className="text-xs line-clamp-2 mt-1">
                                            {template.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3 pt-0">
                                    <div className="bg-muted/40 rounded-lg p-2.5 space-y-1.5 text-xs">
                                        {template.items.slice(0, 3).map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 text-foreground/80">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                                <span className="truncate">{item.label}</span>
                                                {item.is_required && (
                                                    <span className="text-[10px] text-destructive shrink-0 font-medium">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {template.items.length > 3 && (
                                            <div className="text-[11px] text-muted-foreground italic pl-5">
                                                +{template.items.length - 3} more items
                                            </div>
                                        )}
                                    </div>

                                    {canManage && (
                                        <div className="flex justify-end pt-2 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                                                onClick={() => handleDeleteTemplate(template.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Template Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Checklist Template</DialogTitle>
                        <DialogDescription>
                            Define standard checklist items to verify quality before work orders can be submitted.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateTemplate} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="template_name">Template Name</Label>
                            <Input
                                id="template_name"
                                placeholder="E.g., HVAC Maintenance & Filter Audit"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                required
                            />
                            {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="template_desc">Description (Optional)</Label>
                            <Textarea
                                id="template_desc"
                                rows={2}
                                placeholder="Brief instructions for field technicians..."
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Checklist Items ({form.data.items.length})</Label>
                                <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-8 gap-1.5 text-xs">
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Item
                                </Button>
                            </div>

                            <div className="space-y-2.5">
                                {form.data.items.map((item, index) => (
                                    <div key={index} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                placeholder={`Item #${index + 1} label (e.g. Check compressor amperage)`}
                                                value={item.label}
                                                onChange={(e) => updateItemField(index, 'label', e.target.value)}
                                                className="text-xs h-9 flex-1"
                                                required
                                            />
                                            <Select
                                                value={item.type}
                                                onValueChange={(val) => updateItemField(index, 'type', val)}
                                            >
                                                <SelectTrigger className="w-32 h-9 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                                    <SelectItem value="text">Text Note</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {form.data.items.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 pl-1">
                                            <Checkbox
                                                id={`req_${index}`}
                                                checked={item.is_required}
                                                onCheckedChange={(checked) => updateItemField(index, 'is_required', checked)}
                                            />
                                            <Label htmlFor={`req_${index}`} className="text-xs font-normal text-muted-foreground cursor-pointer">
                                                Required to complete before job submission
                                            </Label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing || !form.data.name.trim()}>
                                Save Template
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
