'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { Target, Calendar, Info, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStrategyStore } from '@/stores/strategyStore';
import { createGoal } from '@/app/actions/strategy/goals';
import { ObjectiveStatus, StrategyType } from '@prisma/client';

export default function NewGoalModal({ onGoalAdded }: { onGoalAdded: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isNewGoalModalOpen, setIsNewGoalModalOpen } = useStrategyStore();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<StrategyType>('ANNUAL_PLAN');
    const [status, setStatus] = useState<ObjectiveStatus>('ON_TRACK');
    const [targetValue, setTargetValue] = useState('');
    const [unit, setUnit] = useState('');
    const [endDate, setEndDate] = useState('');

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setType('ANNUAL_PLAN');
        setStatus('ON_TRACK');
        setTargetValue('');
        setUnit('');
        setEndDate('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast({ title: 'Error', description: 'Title is required', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await createGoal({
                title,
                description: description || undefined,
                type,
                status,
                targetValue: targetValue ? parseFloat(targetValue) : undefined,
                unit: unit || undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Goal created successfully' });
                setIsNewGoalModalOpen(false);
                resetForm();
                onGoalAdded();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to create goal', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isNewGoalModalOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsNewGoalModalOpen(open);
        }}>
            <DialogContent className="max-w-3xl p-0 bg-[var(--card)] border-[var(--border)] overflow-hidden z-[100]">
                <DialogHeader className="sr-only">
                    <DialogTitle>New OKR / Goal</DialogTitle>
                </DialogHeader>

                <div className={cn("grid grid-cols-1 md:grid-cols-5 h-full", isRTL ? "md:flex-row-reverse" : "")}>
                    <div className="md:col-span-2 bg-[var(--muted)]/30 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--border)]">
                        <div className="space-y-6">
                            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(232,168,56,0.1)]">
                                <Target className="w-7 h-7 text-[var(--primary)]" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Set Objective</h2>
                                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                    Define measurable goals and Objectives and Key Results (OKRs) to drive growth.
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
                                    Objective Details
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Title *</Label>
                                        <Input
                                            placeholder="e.g. Increase recurring revenue"
                                            className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)] transition-all font-bold"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Description</Label>
                                        <Textarea
                                            placeholder="What does success look like?"
                                            className="bg-[var(--muted)]/30 border-[var(--border)] rounded-xl font-medium"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-4 border-t border-[var(--border)]/50">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <Flag className="w-3.5 h-3.5" />
                                    Metrics & Scope
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Type</Label>
                                        <Select value={type} onValueChange={(val: any) => setType(val)}>
                                            <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                                {Object.values(StrategyType).map(s => (
                                                    <SelectItem key={s} value={s} className="font-bold">{s.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Initial Status</Label>
                                        <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                            <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                                {Object.values(ObjectiveStatus).map(s => (
                                                    <SelectItem key={s} value={s} className="font-bold">{s.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Target Value</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 100000"
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                            value={targetValue}
                                            onChange={(e) => setTargetValue(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Unit (optional)</Label>
                                        <Input
                                            placeholder="e.g. $, %, users"
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Target Date</Label>
                                        <Input
                                            type="date"
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border)]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsNewGoalModalOpen(false)}
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
                                    {isSaving ? 'Saving...' : 'Set Goal'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
