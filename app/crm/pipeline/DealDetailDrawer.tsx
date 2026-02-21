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
import { formatCurrency } from '@/lib/utils';
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
            toast({ title: 'Error', description: 'Deal title is required', type: 'error' });
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
                toast({ title: 'Success', description: 'Deal updated successfully' });
                setIsEditing(false);
                onDealUpdated();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to update deal', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsSaving(true);
        try {
            const result = await deleteDeal(selectedDeal.id);
            if (result.success) {
                toast({ title: 'Success', description: 'Deal deleted permanently' });
                setIsDeleteDialogOpen(false);
                setIsDealDrawerOpen(false);
                onDealUpdated();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to delete deal', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const formatStage = (s: string) => {
        return s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <>
            <Sheet open={isDealDrawerOpen} onOpenChange={setIsDealDrawerOpen}>
                <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto p-0 flex flex-col" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    {/* Header Section */}
                    <div className="px-6 py-6 border-b flex-shrink-0" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl bg-[#E8A838] text-black border shadow-sm">
                                    <DollarSign className="h-6 w-6" />
                                </div>
                                <div>
                                    <SheetTitle className="text-xl font-bold leading-none mb-1" style={{ color: 'var(--foreground)' }}>
                                        {selectedDeal.title}
                                    </SheetTitle>
                                    <div className="text-sm font-bold text-green-600 dark:text-green-500">
                                        {formatCurrency(Number(selectedDeal.value))}
                                    </div>
                                </div>
                            </div>

                            {!isEditing && (
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8 hover:bg-[var(--border)]" style={{ color: 'var(--text-muted)' }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600 text-red-400">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {formatStage(selectedDeal.stage)}
                            </Badge>
                            <Badge variant="outline" className="border opacity-70" style={{ background: 'var(--background)', color: 'var(--text-muted)' }}>
                                {String(selectedDeal.priority).toUpperCase()} priority
                            </Badge>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex-1" style={{ background: 'var(--card)' }}>
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Deal Title *</Label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Value (SAR)</Label>
                                        <Input type="number" min="0" step="any" value={value} onChange={(e) => setValue(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Stage</Label>
                                        <Select value={stage} onValueChange={(val: DealStageType) => setStage(val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
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
                                        <Label>Linked Company</Label>
                                        <Select value={companyId} onValueChange={setCompanyId}>
                                            <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
                                            <SelectContent position="popper" className="max-h-[16rem] z-[100]">
                                                <SelectItem value="none">No Company Linked</SelectItem>
                                                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <Label>Linked Contact</Label>
                                        <Select value={clientId} onValueChange={setClientId}>
                                            <SelectTrigger><SelectValue placeholder="Select a contact" /></SelectTrigger>
                                            <SelectContent position="popper" className="max-h-[16rem] z-[100]">
                                                <SelectItem value="none">No Contact Linked</SelectItem>
                                                {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Expected Close</Label>
                                        <Input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent position="popper" className="z-[100]">
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1" disabled={isSaving}>Cancel</Button>
                                    <Button type="button" onClick={handleSave} className="flex-1 bg-[#E8A838] hover:bg-[#d69628] text-black" disabled={isSaving}>
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid gap-4">
                                    {selectedDeal.company?.name && (
                                        <div className="flex items-start gap-3">
                                            <Building2 className="h-5 w-5 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                                            <div>
                                                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{selectedDeal.company.name}</div>
                                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Linked Company</div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDeal.client?.name && (
                                        <div className="flex items-start gap-3">
                                            <User className="h-5 w-5 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                                            <div>
                                                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{selectedDeal.client.name}</div>
                                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Linked Contact</div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDeal.expectedCloseDate && (
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-5 w-5 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                                            <div>
                                                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                                    {new Date(selectedDeal.expectedCloseDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Expected Close Date</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg p-4 border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                                    <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Deal Tracking</div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><Target className="h-4 w-4" /> Created On</span>
                                            <span className="font-medium" style={{ color: 'var(--foreground)' }}>{new Date(selectedDeal.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedDeal.notes && (
                                    <div>
                                        <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Deal Notes</div>
                                        <div className="text-sm p-4 rounded-lg border whitespace-pre-wrap" style={{ background: 'var(--border)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the deal pipeline card and remove it from your records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Deleting...' : 'Delete Deal'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
