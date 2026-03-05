'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { CheckSquare, Calendar, Flag, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasksStore } from '@/stores/tasksStore';
import { updateTask, deleteTask } from '@/app/actions/tasks/tasks';
import { TaskStatus, TaskPriority } from '@prisma/client';

export default function TaskDetailDrawer({ task, onUpdated }: { task: any, onUpdated: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isDetailDrawerOpen, setIsDetailDrawerOpen, setSelectedTaskId } = useTasksStore();
    const [isSaving, setIsSaving] = useState(false);

    const [formState, setFormState] = useState({
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || TaskStatus.TODO,
        priority: task?.priority || TaskPriority.MEDIUM,
        dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    });

    const handleChange = (field: string, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateTask(task.id, {
                ...formState,
                dueDate: formState.dueDate ? new Date(formState.dueDate) : undefined,
            });

            if (result.success) {
                toast({ title: 'Saved', description: 'Task updated successfully.' });
                onUpdated();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to update task', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Unexpected error', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        setIsSaving(true);
        try {
            const res = await deleteTask(task.id);
            if (res.success) {
                toast({ title: 'Deleted', description: 'Task removed.' });
                setIsDetailDrawerOpen(false);
                setSelectedTaskId(null);
                onUpdated();
            } else {
                toast({ title: 'Error', description: res.error, type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Unexpected error', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!task) return null;

    return (
        <Sheet open={isDetailDrawerOpen} onOpenChange={setIsDetailDrawerOpen}>
            <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-xl bg-[var(--background)] border-l border-[var(--border)] p-0 flex flex-col z-[50]">
                <SheetHeader className="sr-only">
                    <SheetTitle>Task Details</SheetTitle>
                </SheetHeader>

                <div className="p-8 pb-6 border-b border-[var(--border)] bg-[var(--card)]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4 flex-1 mr-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--muted)]/50 border border-[var(--border)] flex shrink-0 items-center justify-center shadow-sm">
                                <CheckSquare className="w-6 h-6 text-[var(--primary)]" />
                            </div>
                            <div className="w-full">
                                <Input
                                    value={formState.title}
                                    onChange={e => handleChange('title', e.target.value)}
                                    className="text-xl font-black bg-transparent border-transparent px-0 hover:border-[var(--border)] focus:bg-[var(--muted)]/30 focus:px-3 h-10 w-full rounded-lg transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[var(--background)]">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] border-b border-[var(--border)] pb-2">
                                <Flag className="w-4 h-4" /> Attributes
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Status</Label>
                                    <Select value={formState.status} onValueChange={(val) => handleChange('status', val)}>
                                        <SelectTrigger className="h-10 bg-[var(--card)] border-[var(--border)] font-bold text-xs uppercase tracking-wider rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                            {Object.values(TaskStatus).map(s => (
                                                <SelectItem key={s} value={s} className="font-bold text-xs">{s.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Priority</Label>
                                    <Select value={formState.priority} onValueChange={(val) => handleChange('priority', val)}>
                                        <SelectTrigger className="h-10 bg-[var(--card)] border-[var(--border)] font-bold text-xs uppercase tracking-wider rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                            {Object.values(TaskPriority).map(p => (
                                                <SelectItem key={p} value={p} className="font-bold text-xs">{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] border-b border-[var(--border)] pb-2">
                                <Calendar className="w-4 h-4" /> Schedule
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Due Date</Label>
                                    <Input
                                        type="date"
                                        value={formState.dueDate}
                                        onChange={e => handleChange('dueDate', e.target.value)}
                                        className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10"
                                    />
                                </div>
                                <div className="space-y-1.5 pt-2">
                                    <Label className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Created By</Label>
                                    <div className="flex items-center gap-2 h-10 px-3 bg-[var(--muted)]/30 border-[var(--border)] rounded-xl">
                                        <User className="w-4 h-4 text-[var(--text-disabled)]" />
                                        <span className="text-xs font-bold text-[var(--text-secondary)]">
                                            {task.createdBy?.firstName} {task.createdBy?.lastName}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Description</Label>
                        <Textarea
                            value={formState.description}
                            onChange={e => handleChange('description', e.target.value)}
                            placeholder="Add task details..."
                            className="bg-[var(--card)] border-[var(--border)] font-medium rounded-xl min-h-[150px]"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold uppercase tracking-widest text-[11px] rounded-xl h-12 px-6"
                    >
                        Delete
                    </Button>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDetailDrawerOpen(false)}
                            disabled={isSaving}
                            className="h-12 px-6 rounded-xl border-[var(--border)] font-bold uppercase tracking-widest text-[11px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px]"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
