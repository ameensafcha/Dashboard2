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

export default function NewContactModal({ onContactAdded }: { onContactAdded: () => void }) {
    const { t } = useTranslation();
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Abdullah Al-Faisal"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="abdullah@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+966 5X XXX XXXX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="company">Company (Optional)</Label>
                            <Select value={companyId} onValueChange={setCompanyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a company" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] z-[100]">
                                    <SelectItem value="none">Independent / Personal</SelectItem>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Job Role</Label>
                            <Input
                                id="role"
                                placeholder="e.g. Procurement Manager"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                placeholder="e.g. Riyadh"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Contact Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] z-[100]">
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="lead">Lead (Prospect)</SelectItem>
                                    <SelectItem value="supplier">Supplier</SelectItem>
                                    <SelectItem value="partner">Partner</SelectItem>
                                    <SelectItem value="investor">Investor</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="source">Lead Source</Label>
                            <Select value={source} onValueChange={setSource}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] z-[100]">
                                    <SelectItem value="manual_import">Manual Entry</SelectItem>
                                    <SelectItem value="website">Website Form</SelectItem>
                                    <SelectItem value="event">Event / Expo</SelectItem>
                                    <SelectItem value="referral">Referral</SelectItem>
                                    <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                                    <SelectItem value="social_media">Social Media</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="notes">Private Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Add context, meeting notes, or preferences..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsNewContactModalOpen(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-[#E8A838] text-black hover:bg-[#d69628]"
                        >
                            {isSaving ? 'Saving...' : 'Add Contact'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
