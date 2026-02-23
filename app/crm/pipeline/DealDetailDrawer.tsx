'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, DollarSign, Building2, User, Target, Trash2 } from 'lucide-react';
import { useCrmStore, DealStageType } from '@/stores/crmStore';
import { updateDeal, deleteDeal } from '@/app/actions/crm/deals';
import { formatCurrency, cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DealDetailDrawer({ onDealUpdated }: { onDealUpdated: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isDealDrawerOpen, setIsDealDrawerOpen, selectedDeal, companies, contacts } = useCrmStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Form State for editing
    const [title, setTitle] = useState('');
    const [value, setValue] = useState('');
    const [stage, setStage] = useState<DealStageType>('new_lead');
    const [priority, setPriority] = useState('medium');
    const [companyId, setCompanyId] = useState('none');
    const [clientId, setClientId] = useState('none');
    const [expectedCloseDate, setExpectedCloseDate] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (selectedDeal) {
            setTitle(selectedDeal.title || '');
            setValue(selectedDeal.value?.toString() || '0');
            setStage(selectedDeal.stage);
            setPriority(selectedDeal.priority || 'medium');
            setCompanyId(selectedDeal.companyId || 'none');
            setClientId(selectedDeal.clientId || 'none');

            if (selectedDeal.expectedCloseDate) {
                const date = new Date(selectedDeal.expectedCloseDate);
                setExpectedCloseDate(date.toISOString().split('T')[0]);
            } else {
                setExpectedCloseDate('');
            }

            setNotes(selectedDeal.notes || '');
            setIsEditing(false);
        }
    }, [selectedDeal, isDealDrawerOpen]);

    if (!selectedDeal) return null;

    const handleSave = async () => {
        if (!title.trim()) {
            toast({ title: t.error, description: 'Deal title is required', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateDeal(selectedDeal.id, {
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
                toast({ title: t.success, description: 'Deal updated successfully' });
                setIsEditing(false);
                onDealUpdated();
            } else {
                toast({ title: t.error, description: result.error || 'Failed to update deal', type: 'error' });
            }
        } catch (error) {
            toast({ title: t.error, description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsSaving(true);
        try {
            const result = await deleteDeal(selectedDeal.id);
            if (result.success) {
                toast({ title: t.success, description: 'Deal deleted permanently' });
                setIsDeleteDialogOpen(false);
                setIsDealDrawerOpen(false);
                onDealUpdated();
            } else {
                toast({ title: t.error, description: result.error || 'Failed to delete deal', type: 'error' });
            }
        } catch (error) {
            toast({ title: t.error, description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const formatStage = (s: string) => {
        return (t as any)[`stage_${s}`] || s;
    };

    return (
        <>
            <Sheet open={isDealDrawerOpen} onOpenChange={setIsDealDrawerOpen}>
                <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-[500px] overflow-y-auto p-0 flex flex-col border-[var(--border)] bg-[var(--card)] shadow-2xl">
                    {/* Header Section */}
                    <div className="px-8 py-10 border-b border-[var(--border)] bg-[var(--muted)]/30">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/20 border border-[var(--primary)]/10">
                                    <Target className="h-7 w-7" />
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-black leading-tight mb-1 text-[var(--text-primary)] uppercase tracking-tight">
                                        {selectedDeal.title}
                                    </SheetTitle>
                                    <div className="text-lg font-black text-[var(--primary)] tracking-tight">
                                        SAR {Number(selectedDeal.value).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {!isEditing && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} className="h-10 w-10 rounded-xl border-[var(--border)] bg-[var(--card)] hover:bg-[var(--primary)] hover:text-white transition-all">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="h-10 w-10 rounded-xl border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Badge variant="outline" className="h-7 px-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 font-black text-[10px] uppercase">
                                {formatStage(selectedDeal.stage)}
                            </Badge>
                            <Badge variant="outline" className="h-7 px-3 rounded-lg border-[var(--border)] bg-[var(--card)] text-[var(--text-disabled)] font-black text-[10px] uppercase tracking-widest">
                                {(t as any)[`priority_${selectedDeal.priority}`] || selectedDeal.priority} priority
                            </Badge>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 flex-1 bg-[var(--card)]">
                        {isEditing ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{(t as any).productName} *</Label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold" required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{(t as any).estValue} (SAR)</Label>
                                        <Input type="number" min="0" step="any" value={value} onChange={(e) => setValue(e.target.value)} className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.status}</Label>
                                        <Select value={stage} onValueChange={(val: DealStageType) => setStage(val)}>
                                            <SelectTrigger className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold"><SelectValue /></SelectTrigger>
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

                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.companies}</Label>
                                        <Select value={companyId} onValueChange={setCompanyId}>
                                            <SelectTrigger className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold"><SelectValue placeholder="Select a company" /></SelectTrigger>
                                            <SelectContent position="popper" className="max-h-[16rem] z-[100] rounded-2xl border-[var(--border)] bg-[var(--card)] shadow-2xl p-1">
                                                <SelectItem value="none">No Company Linked</SelectItem>
                                                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.contacts}</Label>
                                        <Select value={clientId} onValueChange={setClientId}>
                                            <SelectTrigger className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold"><SelectValue placeholder="Select a contact" /></SelectTrigger>
                                            <SelectContent position="popper" className="max-h-[16rem] z-[100] rounded-2xl border-[var(--border)] bg-[var(--card)] shadow-2xl p-1">
                                                <SelectItem value="none">No Contact Linked</SelectItem>
                                                {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{(t as any).expectedClose}</Label>
                                        <Input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.status}</Label>
                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger className="h-12 rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent position="popper" className="z-[100] rounded-2xl border-[var(--border)] bg-[var(--card)] shadow-2xl p-1">
                                                <SelectItem value="low">{(t as any).priority_low}</SelectItem>
                                                <SelectItem value="medium">{(t as any).priority_medium}</SelectItem>
                                                <SelectItem value="high">{(t as any).priority_high}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.notes}</Label>
                                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl bg-[var(--muted)]/50 border-[var(--border)] font-bold min-h-[120px]" rows={4} />
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-12 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-[var(--border)]" disabled={isSaving}>{t.cancel}</Button>
                                    <Button type="button" onClick={handleSave} className="h-12 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-xl shadow-[var(--primary)]/20" disabled={isSaving}>
                                        {isSaving ? '...' : t.save}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <div className="grid gap-6">
                                    {selectedDeal.company?.name && (
                                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--muted)]/40 border border-[var(--border)] group hover:border-[var(--primary)]/30 transition-all">
                                            <Building2 className="h-6 w-6 mt-0.5 text-[var(--primary)]" />
                                            <div>
                                                <div className="text-sm font-black text-[var(--text-primary)] mb-0.5">{selectedDeal.company.name}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Linked Company</div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDeal.client?.name && (
                                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--muted)]/40 border border-[var(--border)] group hover:border-[var(--primary)]/30 transition-all">
                                            <User className="h-6 w-6 mt-0.5 text-blue-400" />
                                            <div>
                                                <div className="text-sm font-black text-[var(--text-primary)] mb-0.5">{selectedDeal.client.name}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Linked Contact</div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDeal.expectedCloseDate && (
                                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--muted)]/40 border border-[var(--border)] group hover:border-[var(--primary)]/30 transition-all">
                                            <Calendar className="h-6 w-6 mt-0.5 text-emerald-400" />
                                            <div>
                                                <div className="text-sm font-black text-[var(--text-primary)] mb-0.5">
                                                    {new Date(selectedDeal.expectedCloseDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{(t as any).expectedClose}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-[2rem] p-8 border border-[var(--border)] bg-[var(--muted)]/30">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-6">Pipeline Intelligence</div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="flex items-center gap-3 font-bold text-[var(--text-disabled)] uppercase tracking-widest"><Target className="h-4 w-4 text-[var(--primary)]" /> Created On</span>
                                            <span className="font-black text-[var(--text-primary)]">{new Date(selectedDeal.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedDeal.notes && (
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Strategy & Notes</div>
                                        <div className="text-sm p-6 rounded-[2rem] border border-[var(--border)] bg-[var(--muted)]/30 text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-bold">
                                            {selectedDeal.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2.5rem] border-[var(--border)] bg-[var(--card)] p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)]">
                            {t.areYouSure}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-bold text-[var(--text-disabled)] leading-relaxed">
                            This action cannot be undone. This will permanently delete the deal pipeline card and remove it from your records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel disabled={isSaving} className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] border-[var(--border)]">{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-600/20"
                            disabled={isSaving}
                        >
                            {isSaving ? '...' : (t as any).deleteDeal || 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
