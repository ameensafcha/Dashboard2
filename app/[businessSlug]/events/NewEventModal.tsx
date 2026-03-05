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
import { Calendar, Info, MapPin, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEventsStore } from '@/stores/eventsStore';
import { createEvent } from '@/app/actions/events/events';
import { EventType } from '@prisma/client';

export default function NewEventModal({ onEventAdded }: { onEventAdded: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isNewEventModalOpen, setIsNewEventModalOpen } = useEventsStore();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<EventType>('EXPO');
    const [venue, setVenue] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('SA');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');
    const [boothNumber, setBoothNumber] = useState('');
    const [notes, setNotes] = useState('');

    const resetForm = () => {
        setName('');
        setType('EXPO');
        setVenue('');
        setCity('');
        setCountry('SA');
        setStartDate('');
        setEndDate('');
        setBudget('');
        setBoothNumber('');
        setNotes('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !startDate) {
            toast({ title: 'Error', description: 'Please fill in required fields.', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await createEvent({
                name,
                type,
                status: 'PLANNING',
                venue: venue || undefined,
                city: city || undefined,
                country,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : undefined,
                budget: budget ? parseFloat(budget) : undefined,
                boothNumber: boothNumber || undefined,
                notes: notes || undefined,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Event created successfully' });
                setIsNewEventModalOpen(false);
                resetForm();
                onEventAdded();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to create event', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isNewEventModalOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsNewEventModalOpen(open);
        }}>
            <DialogContent className="max-w-4xl p-0 bg-[var(--card)] border-[var(--border)] overflow-hidden z-[100]">
                <DialogHeader className="sr-only">
                    <DialogTitle>New Event</DialogTitle>
                </DialogHeader>

                <div className={cn("grid grid-cols-1 md:grid-cols-5 h-full", isRTL ? "md:flex-row-reverse" : "")}>
                    <div className="md:col-span-2 bg-[var(--muted)]/30 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--border)]">
                        <div className="space-y-6">
                            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(232,168,56,0.1)]">
                                <Calendar className="w-7 h-7 text-[var(--primary)]" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Plan Event</h2>
                                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                    Register a new exhibition, conference, or popup to track leads and logistics.
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
                                    Basics
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Event Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. LEAP 2026"
                                            className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)] transition-all font-bold"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="type" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Type *</Label>
                                            <Select value={type} onValueChange={(val: any) => setType(val)}>
                                                <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                                    {Object.values(EventType).map(t => (
                                                        <SelectItem key={t} value={t} className="font-bold">{t.replace('_', ' ')}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="budget" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Allocated Budget</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-4 h-4 w-4 text-[var(--text-disabled)]" />
                                                <Input
                                                    id="budget"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="pl-12 bg-[var(--muted)]/30 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)]"
                                                    value={budget}
                                                    onChange={(e) => setBudget(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Location & Time */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <MapPin className="w-3.5 h-3.5" />
                                    Location & Dates
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="venue" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Venue</Label>
                                        <Input
                                            id="venue"
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                            value={venue}
                                            onChange={(e) => setVenue(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">City</Label>
                                        <Input
                                            id="city"
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                        />
                                    </div>
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
                                        <Label htmlFor="endDate" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">End Date</Label>
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
                                    onClick={() => setIsNewEventModalOpen(false)}
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
                                    {isSaving ? 'Creating...' : 'Create Event'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
