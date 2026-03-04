'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useCrmStore, DealStageType } from '@/stores/crmStore';
import { createDeal } from '@/app/actions/crm/deals';
import { useTranslation } from '@/lib/i18n';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewDealModal({ onDealAdded }: { onDealAdded: () => void }) {
    const { t } = useTranslation();
    const { isNewDealModalOpen, setIsNewDealModalOpen, companies, contacts } = useCrmStore();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [value, setValue] = useState('');
    const [stage, setStage] = useState<DealStageType>('new_lead');
    const [priority, setPriority] = useState('medium');
    const [companyId, setCompanyId] = useState('none');
    const [clientId, setClientId] = useState('none');
    const [expectedCloseDate, setExpectedCloseDate] = useState('');
    const [notes, setNotes] = useState('');

    // State for progressive disclosure
    const [showFinancials, setShowFinancials] = useState(false);

    const resetForm = () => {
        setTitle('');
        setValue('');
        setStage('new_lead');
        setPriority('medium');
        setCompanyId('none');
        setClientId('none');
        setExpectedCloseDate('');
        setNotes('');
        setShowFinancials(false);
    };

    // Smart Contact-Company logic
    const contactHasNoCompany = clientId !== 'none' && contacts.find(c => c.id === clientId)?.companyId === null;

    const filteredContacts = companyId !== 'none'
        ? contacts.filter(c => c.companyId === companyId)
        : contacts;

    const handleContactChange = (id: string) => {
        setClientId(id);
        const contact = contacts.find(c => c.id === id);
        if (contact?.companyId) {
            setCompanyId(contact.companyId);
        } else if (id !== 'none') {
            setCompanyId('none');
        }
    };

    const handleCompanyChange = (id: string) => {
        setCompanyId(id);
        setClientId('none'); // Reset contact when company changes
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast({ title: t.error, description: 'Deal title is required', type: 'error' });
            return;
        }

        if (companyId === 'none' && clientId === 'none') {
            toast({ title: t.error, description: (t as any).companyRequired, type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await createDeal({
                title,
                value: value ? parseFloat(value) : 0,
                stage: stage as any,
                priority: priority as any,
                companyId: companyId !== 'none' ? companyId : undefined,
                clientId: clientId !== 'none' ? clientId : undefined,
                expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
                notes: notes || undefined,
            });

            if (result.success) {
                toast({ title: t.success, description: 'Deal added to pipeline' });
                setIsNewDealModalOpen(false);
                resetForm();
                onDealAdded();
            } else {
                toast({ title: t.error, description: result.error || 'Failed to add deal', type: 'error' });
            }
        } catch (error) {
            toast({ title: t.error, description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isNewDealModalOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsNewDealModalOpen(open);
        }}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[2rem] border-[var(--border)] bg-[var(--card)] p-8">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)]">
                        {(t as any).addDeal}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{(t as any).productName} *</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Annual Wholesale Contract"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Company & Contact Linkage */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{(t as any).company}</Label>
                                <Select value={companyId} onValueChange={handleCompanyChange} disabled={contactHasNoCompany}>
                                    <SelectTrigger className={cn(
                                        "h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold",
                                        contactHasNoCompany && "opacity-50 cursor-not-allowed"
                                    )}>
                                        <SelectValue placeholder="Select a company" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="max-h-[16rem] z-[100] rounded-2xl border-[var(--border)] bg-[var(--card)] shadow-2xl p-1">
                                        <SelectItem value="none">No Company Linked</SelectItem>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {contactHasNoCompany && (
                                    <p className="text-[10px] text-amber-500 font-bold px-1">Independent contact (no company)</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="client" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{(t as any).client}</Label>
                                <Select value={clientId} onValueChange={handleContactChange}>
                                    <SelectTrigger className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold">
                                        <SelectValue placeholder="Select a contact" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="max-h-[16rem] z-[100] rounded-2xl border-[var(--border)] bg-[var(--card)] shadow-2xl p-1">
                                        <SelectItem value="none">No Contact Linked</SelectItem>
                                        {filteredContacts.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Financials - Progressive Disclosure */}
                        <div className="space-y-4 pt-4 border-t border-[var(--border)]/10">
                            {!showFinancials && (stage === 'new_lead' || stage === 'qualified') ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowFinancials(true)}
                                    className="w-full h-10 border-2 border-dashed border-[var(--border)] rounded-xl text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] hover:border-[var(--primary)]/30 hover:text-[var(--primary)]"
                                >
                                    + {(t as any).addFinancialEstimate}
                                </Button>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="value" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{(t as any).estValue} (SAR)</Label>
                                        <Input
                                            id="value"
                                            type="number"
                                            min="0"
                                            step="any"
                                            placeholder="0.00"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="expectedCloseDate" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{(t as any).expectedClose}</Label>
                                        <Input
                                            id="expectedCloseDate"
                                            type="date"
                                            value={expectedCloseDate}
                                            onChange={(e) => setExpectedCloseDate(e.target.value)}
                                            className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stage & Priority */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]/10">
                            <div className="space-y-2">
                                <Label htmlFor="stage" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.status}</Label>
                                <Select value={stage} onValueChange={(val: DealStageType) => setStage(val)}>
                                    <SelectTrigger className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="z-[100] rounded-2xl border-[var(--border)] bg-[var(--card)] shadow-2xl p-1">
                                        <SelectItem value="new_lead">{(t as any).stage_new_lead}</SelectItem>
                                        <SelectItem value="qualified">{(t as any).stage_qualified}</SelectItem>
                                        <SelectItem value="sample_sent">{(t as any).stage_sample_sent}</SelectItem>
                                        <SelectItem value="proposal">{(t as any).stage_proposal}</SelectItem>
                                        <SelectItem value="negotiation">{(t as any).stage_negotiation}</SelectItem>
                                        <SelectItem value="closed_won">{(t as any).stage_closed_won}</SelectItem>
                                        <SelectItem value="closed_lost">{(t as any).stage_closed_lost}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Priority</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="z-[100] rounded-2xl border-[var(--border)] bg-[var(--card)] shadow-2xl p-1">
                                        <SelectItem value="low">{(t as any).priority_low}</SelectItem>
                                        <SelectItem value="medium">{(t as any).priority_medium}</SelectItem>
                                        <SelectItem value="high">{(t as any).priority_high}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.notes}</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add intelligence, pain points, or next steps..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="rounded-xl bg-[var(--muted)]/50 border-[var(--border)] min-h-[100px] font-bold"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]/10">
                            <Button type="button" variant="outline" onClick={() => setIsNewDealModalOpen(false)} disabled={isSaving} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">
                                {t.cancel}
                            </Button>
                            <Button type="submit" disabled={isSaving} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-xl shadow-[var(--primary)]/20">
                                {isSaving ? '...' : (t as any).addDeal}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
