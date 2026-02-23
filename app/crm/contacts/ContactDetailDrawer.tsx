'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { Building2, Mail, MapPin, Phone, Edit, Trash2, Calendar, Target, Plus, X, User, Briefcase, Globe, Info, MessageSquare, ArrowRight } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { updateContact, deleteContact } from '@/app/actions/crm/contacts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function ContactDetailDrawer({ onContactUpdated }: { onContactUpdated: () => void }) {
    const { t, language, isRTL } = useTranslation();
    const { isContactDrawerOpen, setIsContactDrawerOpen, selectedContact, companies } = useCrmStore();
    const [isEditing, setIsEditing] = useState(false);
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

    useEffect(() => {
        if (selectedContact) {
            setName(selectedContact.name);
            setEmail(selectedContact.email || '');
            setPhone(selectedContact.phone || '');
            setCompanyId(selectedContact.companyId || 'none');
            setRole(selectedContact.role || '');
            setType(selectedContact.type);
            setSource(selectedContact.source);
            setCity(selectedContact.city || '');
            setNotes(selectedContact.notes || '');
            setIsEditing(false);
        }
    }, [selectedContact]);

    if (!selectedContact) return null;

    const handleSave = async () => {
        if (!name.trim()) {
            toast({ title: 'Error', description: 'Contact name is required', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateContact(selectedContact.id, {
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
                toast({ title: 'Success', description: 'Contact updated successfully' });
                setIsEditing(false);
                onContactUpdated();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to update contact', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) return;

        try {
            const result = await deleteContact(selectedContact.id);
            if (result.success) {
                toast({ title: 'Success', description: 'Contact deleted successfully' });
                setIsContactDrawerOpen(false);
                onContactUpdated();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to delete contact', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        }
    };

    const formatSource = (src: string) => {
        return src.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getTypeStyles = (t: string) => {
        switch (t) {
            case 'client': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'lead': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'supplier': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'partner': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'investor': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <Sheet open={isContactDrawerOpen} onOpenChange={setIsContactDrawerOpen}>
            <SheetContent
                className="w-full sm:max-w-2xl overflow-y-auto bg-[var(--card)] border-l border-[var(--border)] p-0 flex flex-col"
                side={isRTL ? "left" : "right"}
            >
                {/* Header Section */}
                <div className="p-10 border-b border-[var(--border)] bg-[var(--muted)]/20 relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                        <User size={120} />
                    </div>

                    <div className={cn("space-y-6 relative z-10", isRTL ? "text-right" : "")}>
                        <div className={cn("flex items-start justify-between gap-4", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center font-black text-2xl text-[var(--primary)] shadow-lg uppercase">
                                {selectedContact.name.substring(0, 2)}
                            </div>
                            <div className="flex gap-2">
                                {!isEditing && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            className="h-10 px-5 rounded-xl border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)] font-black uppercase tracking-widest text-[10px] hover:bg-[var(--muted)] flex items-center gap-2"
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                            {t.edit}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDelete}
                                            className="h-10 w-10 p-0 rounded-xl border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                <SheetTitle className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                                    {selectedContact.name}
                                </SheetTitle>
                                <Badge variant="outline" className={cn("font-black uppercase text-[10px] tracking-widest border-0 px-3 py-1", getTypeStyles(selectedContact.type))}>
                                    {selectedContact.type}
                                </Badge>
                            </div>

                            <div className={cn("flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]", isRTL ? "flex-row-reverse" : "")}>
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5 text-[var(--primary)]/60" />
                                    {selectedContact.company?.name || 'Independent'}
                                </div>
                                {selectedContact.role && (
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-3.5 w-3.5 text-[var(--primary)]/60" />
                                        {selectedContact.role}
                                    </div>
                                )}
                                {selectedContact.city && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-[var(--primary)]/60" />
                                        {selectedContact.city}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-10 flex-1 space-y-12 bg-[var(--card)]">
                    {isEditing ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <Edit className="w-3.5 h-3.5" />
                                    Edit Contact Details
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Full Name</Label>
                                        <Input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="bg-[var(--muted)]/50 border-[var(--border)] h-12 rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Email</Label>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Phone</Label>
                                        <Input
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Company</Label>
                                        <Select value={companyId} onValueChange={setCompanyId}>
                                            <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold">
                                                <SelectValue placeholder="Select a company" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                                <SelectItem value="none" className="font-bold">Independent / Personal</SelectItem>
                                                {companies.map(c => (
                                                    <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Job Role</Label>
                                        <Input
                                            value={role}
                                            onChange={e => setRole(e.target.value)}
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">City</Label>
                                        <Input
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Contact Type</Label>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                                <SelectItem value="client" className="font-bold">Client</SelectItem>
                                                <SelectItem value="lead" className="font-bold">Lead</SelectItem>
                                                <SelectItem value="supplier" className="font-bold">Supplier</SelectItem>
                                                <SelectItem value="partner" className="font-bold">Partner</SelectItem>
                                                <SelectItem value="investor" className="font-bold">Investor</SelectItem>
                                                <SelectItem value="other" className="font-bold">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Lead Source</Label>
                                        <Select value={source} onValueChange={setSource}>
                                            <SelectTrigger className="bg-[var(--muted)]/30 border-[var(--border)] h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                                <SelectItem value="manual_import" className="font-bold">Manual</SelectItem>
                                                <SelectItem value="website" className="font-bold">Website</SelectItem>
                                                <SelectItem value="event" className="font-bold">Event</SelectItem>
                                                <SelectItem value="referral" className="font-bold">Referral</SelectItem>
                                                <SelectItem value="cold_outreach" className="font-bold">Outreach</SelectItem>
                                                <SelectItem value="social_media" className="font-bold">Social Media</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Private Notes</Label>
                                        <Textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={4}
                                            className="bg-[var(--muted)]/30 border-[var(--border)] rounded-xl font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border)]">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                    className="h-12 px-8 rounded-xl border-[var(--border)] font-bold uppercase tracking-widest text-[11px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-[#E8A838] text-black hover:bg-[#d69628] h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#E8A838]/20"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-12 animate-in fade-in duration-700">
                            {/* 1. Impact Metrics */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-[var(--muted)]/20 rounded-2xl p-6 border border-[var(--border)] group hover:border-[#3b82f6]/30 transition-all">
                                    <div className={cn("flex items-center gap-3 mb-4", isRTL ? "flex-row-reverse" : "")}>
                                        <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                                            <Target className="w-4 h-4 text-[#3b82f6]" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Linked Deals</span>
                                    </div>
                                    <div className={cn("text-3xl font-black text-[var(--text-primary)] tracking-tight", isRTL ? "text-right" : "")}>
                                        {selectedContact._count?.deals || 0}
                                    </div>
                                </div>

                                <div className="bg-[var(--muted)]/20 rounded-2xl p-6 border border-[var(--border)] group hover:border-[var(--primary)]/30 transition-all">
                                    <div className={cn("flex items-center gap-3 mb-4", isRTL ? "flex-row-reverse" : "")}>
                                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-[var(--primary)]" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Relationship Age</span>
                                    </div>
                                    <div className={cn("text-sm font-black text-[var(--text-primary)] tracking-tight uppercase", isRTL ? "text-right" : "")}>
                                        Since {new Date(selectedContact.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Contact Details */}
                            <div className="space-y-6">
                                <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                    <div className="w-1.5 h-6 bg-[var(--primary)] rounded-full" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Communications</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className={cn("bg-[var(--muted)]/10 border border-[var(--border)] rounded-2xl p-5 flex items-center justify-between group hover:bg-[var(--muted)]/20 transition-all", isRTL ? "flex-row-reverse" : "")}>
                                        <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                                            <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center text-[var(--text-disabled)] group-hover:text-[var(--primary)] transition-colors">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className={cn("text-left space-y-0.5", isRTL ? "text-right" : "")}>
                                                <div className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-tighter">Professional Email</div>
                                                <div className="text-sm font-bold text-[var(--text-primary)]">{selectedContact.email || 'N/A'}</div>
                                            </div>
                                        </div>
                                        {selectedContact.email && (
                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-[var(--text-disabled)] hover:text-[var(--primary)]" asChild>
                                                <a href={`mailto:${selectedContact.email}`}><ArrowRight className={cn("w-4 h-4", isRTL ? "rotate-180" : "")} /></a>
                                            </Button>
                                        )}
                                    </div>

                                    <div className={cn("bg-[var(--muted)]/10 border border-[var(--border)] rounded-2xl p-5 flex items-center justify-between group hover:bg-[var(--muted)]/20 transition-all", isRTL ? "flex-row-reverse" : "")}>
                                        <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                                            <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center text-[var(--text-disabled)] group-hover:text-[var(--primary)] transition-colors">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div className={cn("text-left space-y-0.5", isRTL ? "text-right" : "")}>
                                                <div className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-tighter">Direct Line</div>
                                                <div className="text-sm font-bold text-[var(--text-primary)]">{selectedContact.phone || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Notes Section */}
                            {selectedContact.notes && (
                                <div className="space-y-6">
                                    <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                        <div className="w-1.5 h-6 bg-[#3b82f6] rounded-full" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Strategic Notes</h3>
                                    </div>
                                    <div className="bg-[var(--background)] p-6 rounded-2xl border border-[var(--border)] border-l-4 border-l-[#3b82f6] text-[var(--text-primary)] text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                        {selectedContact.notes}
                                    </div>
                                </div>
                            )}

                            {/* 4. CRM Context */}
                            <div className="bg-[var(--muted)]/30 rounded-2xl p-6 border border-[var(--border)] space-y-4">
                                <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                    <Info className="h-4 w-4 text-[var(--primary)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Lead Intelligence</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                    <div className={cn("space-y-1", isRTL ? "text-right" : "")}>
                                        <div className="text-[9px] font-black uppercase text-[var(--text-disabled)] tracking-tighter">Contact Source</div>
                                        <div className="text-xs font-black text-[var(--text-secondary)]">{formatSource(selectedContact.source)}</div>
                                    </div>
                                    <div className={cn("space-y-1", isRTL ? "text-right" : "")}>
                                        <div className="text-[9px] font-black uppercase text-[var(--text-disabled)] tracking-tighter">Origin City</div>
                                        <div className="text-xs font-black text-[var(--text-secondary)]">{selectedContact.city || 'Undisclosed'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
