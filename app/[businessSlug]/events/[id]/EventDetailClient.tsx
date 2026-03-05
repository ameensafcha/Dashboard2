'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEventById } from '@/app/actions/events/events';
import { createEventLead, deleteEventLead, convertEventLeadToContact } from '@/app/actions/events/leads';
import { createEventInventoryItem, deleteEventInventoryItem, updateEventInventoryItemStatus } from '@/app/actions/events/inventory';
import { Card } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Users, Package, Settings, Plus, MapPin, Building2, Briefcase, Mail, Phone, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';

export default function EventDetailClient({ event: initialEvent, businessSlug }: { event: any, businessSlug: string }) {
    const { t, isRTL } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);

    // Modals state
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

    // Lead Form State
    const [leadName, setLeadName] = useState('');
    const [leadCompany, setLeadCompany] = useState('');
    const [leadRole, setLeadRole] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadNotes, setLeadNotes] = useState('');
    const [leadRating, setLeadRating] = useState(3);

    // Inventory Form State
    const [inventoryName, setInventoryName] = useState('');
    const [inventoryQty, setInventoryQty] = useState('1');
    const [inventoryStatus, setInventoryStatus] = useState<'PREPARING' | 'SHIPPED' | 'AT_VENUE' | 'RETURNED'>('PREPARING');

    const { data: event, refetch: refetchEvent } = useQuery({
        queryKey: ['event', initialEvent.id, businessSlug],
        queryFn: () => getEventById(initialEvent.id, businessSlug),
        initialData: initialEvent,
        staleTime: 5_000,
        refetchInterval: 15_000,
    });

    // --- Leads Handlers ---
    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const res = await createEventLead({
            eventId: event.id,
            name: leadName,
            companyName: leadCompany,
            jobTitle: leadRole,
            email: leadEmail,
            phone: leadPhone,
            notes: leadNotes,
            rating: leadRating,
        });

        if (res.success) {
            toast({ title: 'Success', description: 'Lead captured.' });
            setIsLeadModalOpen(false);
            setLeadName(''); setLeadCompany(''); setLeadRole(''); setLeadEmail(''); setLeadPhone(''); setLeadNotes(''); setLeadRating(3);
            refetchEvent();
        } else {
            toast({ title: 'Error', description: res.error, type: 'error' });
        }
        setIsSaving(false);
    };

    const handleConvertLead = async (id: string) => {
        setIsSaving(true);
        const res = await convertEventLeadToContact(id);
        if (res.success) {
            toast({ title: 'Converted!', description: 'Lead transferred to CRM.' });
            refetchEvent();
        } else {
            toast({ title: 'Error', description: res.error, type: 'error' });
        }
        setIsSaving(false);
    };

    const handleDeleteLead = async (id: string) => {
        if (!confirm('Delete lead?')) return;
        setIsSaving(true);
        await deleteEventLead(id, event.id);
        toast({ title: 'Deleted' });
        refetchEvent();
        setIsSaving(false);
    };

    // --- Inventory Handlers ---
    const handleAddInventory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const res = await createEventInventoryItem({
            eventId: event.id,
            name: inventoryName,
            quantity: parseInt(inventoryQty),
            status: inventoryStatus
        });

        if (res.success) {
            toast({ title: 'Success', description: 'Item added.' });
            setIsInventoryModalOpen(false);
            setInventoryName(''); setInventoryQty('1'); setInventoryStatus('PREPARING');
            refetchEvent();
        } else {
            toast({ title: 'Error', description: res.error, type: 'error' });
        }
        setIsSaving(false);
    };

    const handleUpdateInventoryStatus = async (id: string, s: 'PREPARING' | 'SHIPPED' | 'AT_VENUE' | 'RETURNED') => {
        setIsSaving(true);
        await updateEventInventoryItemStatus(id, event.id, s);
        refetchEvent();
        setIsSaving(false);
    };

    const handleDeleteInventory = async (id: string) => {
        if (!confirm('Delete item?')) return;
        setIsSaving(true);
        await deleteEventInventoryItem(id, event.id);
        refetchEvent();
        setIsSaving(false);
    };


    if (!event) return <div>Event not found.</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto px-6 pt-6">
            {/* Header */}
            <div>
                <Link href={`/${businessSlug}/events`} className="inline-flex items-center text-sm font-bold text-[var(--text-disabled)] hover:text-[var(--primary)] mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Events
                </Link>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                                {event.status}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{event.type.replace('_', ' ')}</span>
                        </div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{event.name}</h1>
                        <div className="flex items-center gap-4 mt-4 text-sm font-bold text-[var(--text-secondary)]">
                            <div className="flex items-center gap-1.5 bg-[var(--muted)]/50 px-3 py-1.5 rounded-lg border border-[var(--border)]">
                                <MapPin className="w-4 h-4 text-[var(--text-disabled)]" />
                                {event.venue || event.city ? `${event.venue}${event.venue && event.city ? ', ' : ''}${event.city}` : 'Location TBD'}
                            </div>
                            {event.boothNumber && (
                                <div className="flex items-center gap-1.5 bg-[var(--muted)]/50 px-3 py-1.5 rounded-lg border border-[var(--border)]">
                                    <Package className="w-4 h-4 text-[var(--text-disabled)]" />
                                    Booth #{event.boothNumber}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="leads" className="w-full">
                <TabsList className="bg-[var(--muted)]/30 border border-[var(--border)] p-1 rounded-xl h-14 mb-6">
                    <TabsTrigger value="leads" className="h-10 px-8 rounded-lg font-bold text-sm data-[state=active]:bg-[var(--card)] data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm">
                        <Users className="w-4 h-4 mr-2" />
                        Captured Leads
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="h-10 px-8 rounded-lg font-bold text-sm data-[state=active]:bg-[var(--card)] data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm">
                        <Package className="w-4 h-4 mr-2" />
                        Logistics & Inventory
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="leads" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Leads & Prospects</h2>
                        <Button
                            onClick={() => setIsLeadModalOpen(true)}
                            className="bg-[#E8A838] text-black hover:bg-[#d69628] h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[#E8A838]/20"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Quick Capture Lead
                        </Button>
                    </div>

                    <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border)]/50 bg-[var(--muted)]/5">
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Lead Details</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Company & Role</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Rating</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]/10">
                                {event.leads?.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-20 text-center text-sm font-bold text-[var(--text-disabled)]">No leads captured yet.</td></tr>
                                ) : (
                                    event.leads?.map((lead: any) => (
                                        <tr key={lead.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-sm text-[var(--text-primary)]">{lead.name}</span>
                                                    <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-disabled)]">
                                                        {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                                                        {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-sm text-[var(--text-secondary)]">{lead.companyName || 'Unknown Company'}</span>
                                                    <span className="text-xs font-bold text-[var(--text-disabled)]">{lead.jobTitle || 'No Role'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span key={star} className={`text-sm ${lead.rating >= star ? 'text-amber-500' : 'text-zinc-600'}`}>★</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {lead.converted ? (
                                                    <span className="px-3 py-1.5 rounded-md text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        CRM Contact
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleConvertLead(lead.id)}
                                                            disabled={isSaving}
                                                            className="h-8 px-4 border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10 text-[10px] font-black uppercase tracking-widest"
                                                        >
                                                            Create CRM Profile
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteLead(lead.id)}
                                                            disabled={isSaving}
                                                            className="h-8 px-3 text-red-500 hover:text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest"
                                                        >
                                                            Drop
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Booth Logistics</h2>
                        <Button
                            onClick={() => setIsInventoryModalOpen(true)}
                            className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[var(--primary)]/20"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {event.inventory?.map((item: any) => (
                            <Card key={item.id} className="p-6 border-[var(--border)] bg-[var(--card)] rounded-2xl flex flex-col justify-between hover:border-[var(--primary)]/40 transition-colors">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-[var(--muted)]/50 flex items-center justify-center border border-[var(--border)]">
                                            <Package className="w-6 h-6 text-[var(--text-secondary)]" />
                                        </div>
                                        <span className={cn("px-2.5 py-1 rounded-md text-[9px] font-black uppercase border",
                                            item.status === 'PREPARING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                item.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    item.status === 'AT_VENUE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                        )}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight mb-1">{item.name}</h3>
                                    <p className="text-xs font-bold text-[var(--text-disabled)] mb-4">Quantity: {item.quantity}</p>
                                </div>
                                <div className="space-y-3">
                                    <Select
                                        value={item.status}
                                        onValueChange={(val: any) => handleUpdateInventoryStatus(item.id, val)}
                                        disabled={isSaving}
                                    >
                                        <SelectTrigger className="h-9 w-full bg-[var(--muted)]/30 border-[var(--border)] font-bold text-[10px] uppercase tracking-wider rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                            <SelectItem value="PREPARING" className="font-bold text-[10px]">PREPARING</SelectItem>
                                            <SelectItem value="SHIPPED" className="font-bold text-[10px]">SHIPPED</SelectItem>
                                            <SelectItem value="AT_VENUE" className="font-bold text-[10px]">AT VENUE</SelectItem>
                                            <SelectItem value="RETURNED" className="font-bold text-[10px]">RETURNED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleDeleteInventory(item.id)}
                                        disabled={isSaving}
                                        className="w-full h-9 text-red-500 hover:text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest rounded-lg"
                                    >
                                        Remove Item
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- Modals Below --- */}

            <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
                <DialogContent className="max-w-xl p-8 bg-[var(--card)] border-[var(--border)] rounded-3xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black text-[var(--text-primary)]">Quick Capture Lead</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddLead} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Client Name *</Label>
                            <Input required value={leadName} onChange={e => setLeadName(e.target.value)} className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl" autoFocus />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Company</Label>
                                <Input value={leadCompany} onChange={e => setLeadCompany(e.target.value)} className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Job Title</Label>
                                <Input value={leadRole} onChange={e => setLeadRole(e.target.value)} className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Email</Label>
                                <Input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Phone</Label>
                                <Input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Rating</Label>
                            <Select value={leadRating.toString()} onValueChange={v => setLeadRating(parseInt(v))}>
                                <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                    <SelectItem value="1">1 Star - Low Interest</SelectItem>
                                    <SelectItem value="3">3 Stars - Average</SelectItem>
                                    <SelectItem value="5">5 Stars - Hot Lead</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button disabled={isSaving} type="submit" className="w-full bg-[#E8A838] text-black h-12 rounded-xl font-black uppercase text-[11px] hover:bg-[#d69628]">
                            Save Lead
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
                <DialogContent className="max-w-xl p-8 bg-[var(--card)] border-[var(--border)] rounded-3xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black text-[var(--text-primary)]">Add Logistics Item</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddInventory} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Item Name *</Label>
                            <Input required placeholder="Ex: Pop-up Banners" value={inventoryName} onChange={e => setInventoryName(e.target.value)} className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl" autoFocus />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Quantity</Label>
                                <Input type="number" min="1" required value={inventoryQty} onChange={e => setInventoryQty(e.target.value)} className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Initial Status</Label>
                                <Select value={inventoryStatus} onValueChange={(val: any) => setInventoryStatus(val)}>
                                    <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                        <SelectItem value="PREPARING">Preparing</SelectItem>
                                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                                        <SelectItem value="AT_VENUE">At Venue</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button disabled={isSaving} type="submit" className="w-full bg-[var(--primary)] text-white h-12 rounded-xl font-black uppercase text-[11px] hover:bg-[var(--primary)]/90">
                            Add Item
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
