'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { CheckSquare, Calendar, User, Info, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasksStore } from '@/stores/tasksStore';
import { createTask } from '@/app/actions/tasks/tasks';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
// Simple get all users for the dropdown (assuming existence of some basic user fetch)
// If we don't have one right now, we can omit it or make a quick stub.
// We'll leave the assignedTo blank or stubbed for now until a user list endpoint exists.
// Or we can just use a text input/selector if we have users in CRM context.

export default function NewTaskModal({ onTaskAdded }: { onTaskAdded: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isNewTaskModalOpen, setIsNewTaskModalOpen } = useTasksStore();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<TaskStatus>('TODO');
    const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
    const [dueDate, setDueDate] = useState('');

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setStatus('TODO');
        setPriority('MEDIUM');
        setDueDate('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast({ title: 'Error', description: 'Title is required', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await createTask({
                title,
                description: description || undefined,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : undefined,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Task created successfully' });
                setIsNewTaskModalOpen(false);
                resetForm();
                onTaskAdded();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to create task', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isNewTaskModalOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsNewTaskModalOpen(open);
        }}>
            <DialogContent className="max-w-3xl p-0 bg-[var(--card)] border-[var(--border)] overflow-hidden z-[100]">
                <DialogHeader className="sr-only">
                    <DialogTitle>New Task</DialogTitle>
                </DialogHeader>

                <div className={cn("grid grid-cols-1 md:grid-cols-5 h-full", isRTL ? "md:flex-row-reverse" : "")}>
                    <div className="md:col-span-2 bg-[var(--muted)]/30 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--border)]">
                        <div className="space-y-6">
                            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(232,168,56,0.1)]">
                                <CheckSquare className="w-7 h-7 text-[var(--primary)]" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Create Task</h2>
                                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                    Assign work to your team, track deadlines, and manage your pipeline efficiently.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 p-10 space-y-8 max-h-[85vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-8 pb-10">
                            {/* Basics */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <Info className="w-3.5 h-3.5" />
                                    Task Details
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Title *</Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g. Follow up with client"
                                            className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)] transition-all font-bold"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Add more details about the task..."
                                            className="bg-[var(--muted)]/30 border-[var(--border)] rounded-xl font-medium"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <Flag className="w-3.5 h-3.5" />
                                    Parameters
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Status</Label>
                                        <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                            <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                                {Object.values(TaskStatus).map(s => (
                                                    <SelectItem key={s} value={s} className="font-bold">{s.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priority" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Priority</Label>
                                        <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                                            <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                                {Object.values(TaskPriority).map(p => (
                                                    <SelectItem key={p} value={p} className="font-bold">{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="dueDate" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Due Date</Label>
                                        <Input
                                            id="dueDate"
                                            type="date"
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border)]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsNewTaskModalOpen(false)}
                                    disabled={isSaving}
                                    className="h-12 px-8 rounded-xl border-[var(--border)] font-bold uppercase tracking-widest text-[11px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-[var(--primary)] text-primary-foreground hover:bg-[var(--primary)]/90 h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[var(--primary)]/20"
                                >
                                    {isSaving ? 'Creating...' : 'Create Task'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
