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

export default function NewDealModal({ onDealAdded }: { onDealAdded: () => void }) {
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

    const resetForm = () => {
        setTitle('');
        setValue('');
        setStage('new_lead');
        setPriority('medium');
        setCompanyId('none');
        setClientId('none');
        setExpectedCloseDate('');
        setNotes('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast({ title: 'Error', description: 'Deal title is required', type: 'error' });
            return;
        }

        if (companyId === 'none' && clientId === 'none') {
            toast({ title: 'Error', description: 'Please link the deal to either a Company or a Contact', type: 'error' });
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
                toast({ title: 'Success', description: 'Deal added to pipeline' });
                setIsNewDealModalOpen(false);
                resetForm();
                onDealAdded();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to add deal', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isNewDealModalOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsNewDealModalOpen(open);
        }}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Deal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Deal Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Annual Wholesale Contract"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="value">Deal Value (SAR)</Label>
                            <Input
                                id="value"
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0.00"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stage">Initial Stage</Label>
                            <Select value={stage} onValueChange={(val: DealStageType) => setStage(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    <SelectItem value="new_lead">New Lead</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="sample_sent">Sample Sent</SelectItem>
                                    <SelectItem value="proposal">Proposal</SelectItem>
                                    <SelectItem value="negotiation">Negotiation</SelectItem>
                                    <SelectItem value="closed_won">Closed Won</SelectItem>
                                    <SelectItem value="closed_lost">Closed Lost</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="company">Linked Company</Label>
                            <Select value={companyId} onValueChange={setCompanyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a company" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="max-h-[16rem] z-[100]">
                                    <SelectItem value="none">No Company Linked</SelectItem>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="client">Linked Contact / Individual</Label>
                            <Select value={clientId} onValueChange={setClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a contact" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="max-h-[16rem] z-[100]">
                                    <SelectItem value="none">No Contact Linked</SelectItem>
                                    {contacts.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                            <Input
                                id="expectedCloseDate"
                                type="date"
                                value={expectedCloseDate}
                                onChange={(e) => setExpectedCloseDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="notes">Notes & Next Steps</Label>
                            <Textarea
                                id="notes"
                                placeholder="..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsNewDealModalOpen(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="bg-[#E8A838] text-black hover:bg-[#d69628]">
                            {isSaving ? 'Saving...' : 'Create Deal'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
