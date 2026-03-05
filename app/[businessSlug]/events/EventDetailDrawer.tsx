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
import { Calendar, DollarSign, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEventsStore } from '@/stores/eventsStore';
import { updateEvent, deleteEvent } from '@/app/actions/events/events';
import { EventStatus, EventType } from '@prisma/client';

export default function EventDetailDrawer({ event, onUpdated }: { event: any, onUpdated: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isDetailDrawerOpen, setIsDetailDrawerOpen, setSelectedEventId } = useEventsStore();
    const [isSaving, setIsSaving] = useState(false);

    const [formState, setFormState] = useState({
        name: event?.name || '',
        status: event?.status || EventStatus.PLANNING,
        type: event?.type || EventType.EXPO,
        budget: event?.budget?.toString() || '0',
        actualCost: event?.actualCost?.toString() || '0',
        venue: event?.venue || '',
        city: event?.city || '',
        boothNumber: event?.boothNumber || '',
        notes: event?.notes || '',
    });

    const handleChange = (field: string, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateEvent(event.id, {
                ...formState,
                budget: parseFloat(formState.budget),
                actualCost: parseFloat(formState.actualCost),
            });

            if (result.success) {
                toast({ title: 'Saved', description: 'Event updated successfully.' });
                onUpdated();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to update event', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Unexpected error', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        setIsSaving(true);
        try {
            const res = await deleteEvent(event.id);
            if (res.success) {
                toast({ title: 'Deleted', description: 'Event removed.' });
                setIsDetailDrawerOpen(false);
                setSelectedEventId(null);
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

    if (!event) return null;

    return (
        <Sheet open={isDetailDrawerOpen} onOpenChange={setIsDetailDrawerOpen}>
            <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-xl bg-[var(--background)] border-l border-[var(--border)] p-0 flex flex-col z-[50]">
                <SheetHeader className="sr-only">
                    <SheetTitle>Event Details</SheetTitle>
                </SheetHeader>

                <div className="p-8 pb-6 border-b border-[var(--border)] bg-[var(--card)]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--muted)]/50 border border-[var(--border)] flex items-center justify-center shadow-sm">
                                <Calendar className="w-8 h-8 text-[var(--primary)]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{event.name}</h2>
                                <p className="text-sm font-bold text-[var(--text-secondary)]">{event.eventId}</p>
                            </div>
                        </div>
                        <Select value={formState.status} onValueChange={(val) => handleChange('status', val)}>
                            <SelectTrigger className="w-40 bg-[var(--muted)]/30 border-[var(--border)] font-bold text-xs uppercase tracking-wider rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                {Object.values(EventStatus).map(s => (
                                    <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[var(--background)]">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] border-b border-[var(--border)] pb-2">
                            <MapPin className="w-4 h-4" /> Logistics
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Venue</Label>
                                <Input value={formState.venue} onChange={e => handleChange('venue', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">City</Label>
                                <Input value={formState.city} onChange={e => handleChange('city', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Booth #</Label>
                                <Input value={formState.boothNumber} onChange={e => handleChange('boothNumber', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] border-b border-[var(--border)] pb-2">
                            <DollarSign className="w-4 h-4" /> Financials
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Budget</Label>
                                <Input type="number" value={formState.budget} onChange={e => handleChange('budget', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Actual Cost</Label>
                                <Input type="number" value={formState.actualCost} onChange={e => handleChange('actualCost', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Notes</Label>
                        <Textarea value={formState.notes} onChange={e => handleChange('notes', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-medium rounded-xl min-h-[100px]" />
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
