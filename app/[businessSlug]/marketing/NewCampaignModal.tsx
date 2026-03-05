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
import { Megaphone, Target, DollarSign, Calendar, Info, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketingStore } from '@/stores/marketingStore';
import { createCampaign } from '@/app/actions/marketing/campaigns';
import { CampaignChannel } from '@prisma/client';

export default function NewCampaignModal({ onCampaignAdded }: { onCampaignAdded: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isNewCampaignModalOpen, setIsNewCampaignModalOpen } = useMarketingStore();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [channel, setChannel] = useState<CampaignChannel>('OTHER');
    const [budget, setBudget] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');

    const resetForm = () => {
        setName('');
        setChannel('OTHER');
        setBudget('');
        setStartDate('');
        setEndDate('');
        setNotes('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !budget || !startDate) {
            toast({ title: 'Error', description: 'Please fill in all required fields.', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await createCampaign({
                name,
                channel,
                status: 'DRAFT',
                budget: parseFloat(budget),
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : undefined,
                notes: notes || undefined,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Campaign created successfully' });
                setIsNewCampaignModalOpen(false);
                resetForm();
                onCampaignAdded();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to create campaign', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isNewCampaignModalOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsNewCampaignModalOpen(open);
        }}>
            <DialogContent className="max-w-4xl p-0 bg-[var(--card)] border-[var(--border)] overflow-hidden z-[100]">
                <DialogHeader className="sr-only">
                    <DialogTitle>New Campaign</DialogTitle>
                </DialogHeader>

                <div className={cn("grid grid-cols-1 md:grid-cols-5 h-full", isRTL ? "md:flex-row-reverse" : "")}>
                    <div className="md:col-span-2 bg-[var(--muted)]/30 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--border)]">
                        <div className="space-y-6">
                            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(232,168,56,0.1)]">
                                <Megaphone className="w-7 h-7 text-[var(--primary)]" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Launch Campaign</h2>
                                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                    Set up a new marketing initiative. Track budgets, channels, and performance goals.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-10 border-t border-[var(--border)]">
                            <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                                Tips
                            </div>
                            <ul className="space-y-3">
                                {[
                                    { icon: Target, text: 'Define clear objectives' },
                                    { icon: DollarSign, text: 'Set an accurate budget' },
                                    { icon: Calendar, text: 'End dates are optional' }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-[var(--text-secondary)]">
                                        <item.icon className="w-4 h-4 text-[var(--primary)]/60" />
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="md:col-span-3 p-10 space-y-8 max-h-[85vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-8 pb-10">
                            {/* Basics */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <Info className="w-3.5 h-3.5" />
                                    Basics
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Campaign Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Summer Sale 2026"
                                            className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)] transition-all font-bold"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="channel" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Channel *</Label>
                                            <Select value={channel} onValueChange={(val: any) => setChannel(val)}>
                                                <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                                    {Object.values(CampaignChannel).map(c => (
                                                        <SelectItem key={c} value={c} className="font-bold">{c.replace('_', ' ')}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="budget" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Budget (SAR) *</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-4 h-4 w-4 text-[var(--text-disabled)]" />
                                                <Input
                                                    id="budget"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="5000.00"
                                                    className="pl-12 bg-[var(--muted)]/30 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)]"
                                                    value={budget}
                                                    onChange={(e) => setBudget(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Timeline
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Start Date *</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">End Date (Optional)</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <Label htmlFor="notes" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add context or objectives..."
                                    className="bg-[var(--muted)]/30 border-[var(--border)] rounded-xl font-medium"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border)]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsNewCampaignModalOpen(false)}
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
                                    {isSaving ? 'Creating...' : 'Create Campaign'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
