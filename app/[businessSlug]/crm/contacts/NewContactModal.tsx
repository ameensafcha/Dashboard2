'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useCrmStore } from '@/stores/crmStore';
import { createContact } from '@/app/actions/crm/contacts';
import { useTranslation } from '@/lib/i18n';
import { User, Mail, Phone, Building2, Briefcase, MapPin, Target, Layers, X, Info, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewContactModal({ onContactAdded }: { onContactAdded: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isNewContactModalOpen, setIsNewContactModalOpen, companies } = useCrmStore();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [companyId, setCompanyId] = useState('none');
    const [role, setRole] = useState('');
    const [type, setType] = useState('lead');
    const [source, setSource] = useState('manual_import');
    const [city, setCity] = useState('');
    const [notes, setNotes] = useState('');

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setCompanyId('none');
        setRole('');
        setType('lead');
        setSource('manual_import');
        setCity('');
        setNotes('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast({ title: 'Error', description: 'Contact name is required', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await createContact({
                name,
                email: email || undefined,
                phone: phone || undefined,
                companyId: companyId !== 'none' ? companyId : undefined,
                role: role || undefined,
                type: type as any,
                source: source as any,
                city: city || undefined,
                notes: notes || undefined,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Contact added successfully' });
                setIsNewContactModalOpen(false);
                resetForm();
                onContactAdded();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to add contact', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isNewContactModalOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsNewContactModalOpen(open);
        }}>
            <DialogContent className="max-w-4xl p-0 bg-[var(--card)] border-[var(--border)] overflow-hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>

                <div className={cn("grid grid-cols-1 md:grid-cols-5 h-full min-h-[500px]", isRTL ? "md:flex-row-reverse" : "")}>
                    {/* Left Side: context/summary */}
                    <div className="md:col-span-2 bg-[var(--muted)]/30 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--border)]">
                        <div className="space-y-6">
                            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(232,168,56,0.1)]">
                                <User className="w-7 h-7 text-[var(--primary)]" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Register Contact</h2>
                                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                    Build your network by registering B2B decision makers, partners, or leads. Link them to companies for better context.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-10 border-t border-[var(--border)]">
                            <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                                Best Practices
                            </div>
                            <ul className="space-y-3">
                                {[
                                    { icon: Building2, text: 'Link to existing company profile' },
                                    { icon: Target, text: 'Define lead source for ROI tracking' },
                                    { icon: MessageSquare, text: 'Add strategic meeting context' }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-[var(--text-secondary)]">
                                        <item.icon className="w-4 h-4 text-[var(--primary)]/60" />
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Side: form */}
                    <div className="md:col-span-3 p-10 space-y-8 max-h-[85vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-8 pb-10">
                            {/* Section 1: Core Identity */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <User className="w-3.5 h-3.5" />
                                    Personal Profile
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Full Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Abdullah Al-Faisal"
                                            className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)] transition-all font-bold"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            autoComplete="off"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Business Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-4 h-4 w-4 text-[var(--text-disabled)]" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="abdullah@example.com"
                                                    className="pl-12 bg-[var(--muted)]/30 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)]"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Direct Phone</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-4 h-4 w-4 text-[var(--text-disabled)]" />
                                                <Input
                                                    id="phone"
                                                    placeholder="+966 5X XXX XXXX"
                                                    className="pl-12 bg-[var(--muted)]/30 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)]"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Professional Context */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Professional Affiliation
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="company" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Assign Company</Label>
                                        <Select value={companyId} onValueChange={setCompanyId}>
                                            <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold">
                                                <SelectValue placeholder="Select a company" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                                <SelectItem value="none" className="font-bold">Independent / Personal</SelectItem>
                                                {companies.map(c => (
                                                    <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Management Role</Label>
                                            <Input
                                                id="role"
                                                placeholder="e.g. CEO"
                                                className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Work City</Label>
                                            <Input
                                                id="city"
                                                placeholder="e.g. Riyadh"
                                                className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Lead Intelligence */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <Layers className="w-3.5 h-3.5" />
                                    Lead Intelligence
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Contact Type</Label>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                                <SelectItem value="client" className="font-bold">Client</SelectItem>
                                                <SelectItem value="lead" className="font-bold">Lead (Prospect)</SelectItem>
                                                <SelectItem value="supplier" className="font-bold">Supplier</SelectItem>
                                                <SelectItem value="partner" className="font-bold">Partner</SelectItem>
                                                <SelectItem value="investor" className="font-bold">Investor</SelectItem>
                                                <SelectItem value="other" className="font-bold">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="source" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Acquisition Source</Label>
                                        <Select value={source} onValueChange={setSource}>
                                            <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                                <SelectItem value="manual_import" className="font-bold">Manual Entry</SelectItem>
                                                <SelectItem value="website" className="font-bold">Website Form</SelectItem>
                                                <SelectItem value="event" className="font-bold">Event / Expo</SelectItem>
                                                <SelectItem value="referral" className="font-bold">Referral</SelectItem>
                                                <SelectItem value="cold_outreach" className="font-bold">Cold Outreach</SelectItem>
                                                <SelectItem value="social_media" className="font-bold">Social Media</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Strategic Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Add context, meeting details, or relationship preferences..."
                                        className="bg-[var(--muted)]/30 border-[var(--border)] rounded-xl font-medium"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border)]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsNewContactModalOpen(false)}
                                    disabled={isSaving}
                                    className="h-12 px-8 rounded-xl border-[var(--border)] font-bold uppercase tracking-widest text-[11px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-[#E8A838] text-black hover:bg-[#d69628] h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#E8A838]/20"
                                >
                                    {isSaving ? 'Registering...' : 'Register Contact'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
