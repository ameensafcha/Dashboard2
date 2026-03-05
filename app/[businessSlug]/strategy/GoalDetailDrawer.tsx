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
import { Target, Calendar, Flag, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStrategyStore } from '@/stores/strategyStore';
import { updateGoal, deleteGoal } from '@/app/actions/strategy/goals';
import { ObjectiveStatus, StrategyType } from '@prisma/client';

export default function GoalDetailDrawer({ goal, onUpdated }: { goal: any, onUpdated: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isDetailDrawerOpen, setIsDetailDrawerOpen, setSelectedGoalId } = useStrategyStore();
    const [isSaving, setIsSaving] = useState(false);

    const [formState, setFormState] = useState({
        title: goal?.title || '',
        description: goal?.description || '',
        type: goal?.type || StrategyType.ANNUAL_PLAN,
        status: goal?.status || ObjectiveStatus.ON_TRACK,
        currentValue: goal?.currentValue?.toString() || '0',
        targetValue: goal?.targetValue?.toString() || '',
        unit: goal?.unit || '',
        endDate: goal?.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
    });

    const handleChange = (field: string, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateGoal(goal.id, {
                ...formState,
                currentValue: parseFloat(formState.currentValue) || 0,
                targetValue: formState.targetValue ? parseFloat(formState.targetValue) : undefined,
                endDate: formState.endDate ? new Date(formState.endDate) : undefined,
            });

            if (result.success) {
                toast({ title: 'Saved', description: 'Goal updated successfully.' });
                onUpdated();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to update goal', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Unexpected error', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this objective?')) return;
        setIsSaving(true);
        try {
            const res = await deleteGoal(goal.id);
            if (res.success) {
                toast({ title: 'Deleted', description: 'Goal removed.' });
                setIsDetailDrawerOpen(false);
                setSelectedGoalId(null);
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

    if (!goal) return null;

    const progress = formState.targetValue && parseFloat(formState.targetValue) > 0
        ? Math.min(100, Math.max(0, (parseFloat(formState.currentValue) / parseFloat(formState.targetValue)) * 100))
        : 0;

    return (
        <Sheet open={isDetailDrawerOpen} onOpenChange={setIsDetailDrawerOpen}>
            <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-xl bg-[var(--background)] border-l border-[var(--border)] p-0 flex flex-col z-[50]">
                <SheetHeader className="sr-only">
                    <SheetTitle>Goal Details</SheetTitle>
                </SheetHeader>

                <div className="p-8 pb-6 border-b border-[var(--border)] bg-[var(--card)]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4 flex-1 mr-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--muted)]/50 border border-[var(--border)] flex shrink-0 items-center justify-center shadow-sm">
                                <Target className="w-6 h-6 text-[var(--primary)]" />
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

                    {/* Progress Bar Display */}
                    {formState.targetValue && (
                        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
                            <div className="flex justify-between items-end mb-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Current Progress</p>
                                    <h4 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                                        {formState.currentValue} <span className="text-sm text-[var(--text-disabled)] font-bold">/ {formState.targetValue} {formState.unit}</span>
                                    </h4>
                                </div>
                                <span className="text-lg font-black text-[var(--primary)] tracking-tight">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="h-3 w-full bg-[var(--muted)] rounded-full overflow-hidden border border-[var(--border)]">
                                <div
                                    className={cn("h-full transition-all duration-500", progress >= 100 ? "bg-emerald-500" : "bg-[var(--primary)]")}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

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
                                            {Object.values(ObjectiveStatus).map(s => (
                                                <SelectItem key={s} value={s} className="font-bold text-xs">{s.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Type</Label>
                                    <Select value={formState.type} onValueChange={(val) => handleChange('type', val)}>
                                        <SelectTrigger className="h-10 bg-[var(--card)] border-[var(--border)] font-bold text-xs uppercase tracking-wider rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                            {Object.values(StrategyType).map(t => (
                                                <SelectItem key={t} value={t} className="font-bold text-xs">{t.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] border-b border-[var(--border)] pb-2">
                                <Activity className="w-4 h-4" /> KPI Metrics
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Current Value</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formState.currentValue}
                                        onChange={e => handleChange('currentValue', e.target.value)}
                                        className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Target Date</Label>
                                    <Input
                                        type="date"
                                        value={formState.endDate}
                                        onChange={e => handleChange('endDate', e.target.value)}
                                        className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Description</Label>
                        <Textarea
                            value={formState.description}
                            onChange={e => handleChange('description', e.target.value)}
                            placeholder="What does success look like for this goal?"
                            className="bg-[var(--card)] border-[var(--border)] font-medium rounded-xl min-h-[120px]"
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
