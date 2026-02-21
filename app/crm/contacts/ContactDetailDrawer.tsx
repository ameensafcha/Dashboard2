import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { Building2, Mail, MapPin, Phone, Edit, Trash2, Calendar, Target, Plus, X } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { updateContact, deleteContact } from '@/app/actions/crm/contacts';
import { Badge } from '@/components/ui/badge';

export default function ContactDetailDrawer({ onContactUpdated }: { onContactUpdated: () => void }) {
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
                // Optionally close the drawer
                // setIsContactDrawerOpen(false);
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

    // Helper to format source nicely
    const formatSource = (src: string) => {
        return src.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getTypeColor = (t: string) => {
        switch (t) {
            case 'client': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'lead': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'supplier': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'partner': return 'bg-green-50 text-green-700 border-green-200';
            case 'investor': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <Sheet open={isContactDrawerOpen} onOpenChange={setIsContactDrawerOpen}>
            <SheetContent className="w-full sm:max-w-[450px] overflow-y-auto p-0 flex flex-col bg-white">
                {/* Header Section */}
                <div className="bg-gray-50 px-6 py-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xl uppercase">
                                {selectedContact.name.substring(0, 2)}
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-bold text-gray-900 leading-none mb-1">
                                    {selectedContact.name}
                                </SheetTitle>
                                <div className="text-sm text-gray-500 font-medium">
                                    {selectedContact.role ? `${selectedContact.role} at ` : ''}
                                    {selectedContact.company?.name || 'Independent Contact'}
                                </div>
                            </div>
                        </div>

                        {!isEditing && (
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8 text-gray-500 hover:text-gray-900">
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Badge variant="outline" className={`${getTypeColor(selectedContact.type)}`}>
                            {selectedContact.type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                            Source: {formatSource(selectedContact.source)}
                        </Badge>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 bg-white">
                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input value={phone} onChange={e => setPhone(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Select value={companyId} onValueChange={setCompanyId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Independent / Personal</SelectItem>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Job Role</Label>
                                    <Input value={role} onChange={e => setRole(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input value={city} onChange={e => setCity(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Contact Type</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="client">Client</SelectItem>
                                            <SelectItem value="lead">Lead</SelectItem>
                                            <SelectItem value="supplier">Supplier</SelectItem>
                                            <SelectItem value="partner">Partner</SelectItem>
                                            <SelectItem value="investor">Investor</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Lead Source</Label>
                                    <Select value={source} onValueChange={setSource}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manual_import">Manual</SelectItem>
                                            <SelectItem value="website">Website</SelectItem>
                                            <SelectItem value="event">Event</SelectItem>
                                            <SelectItem value="referral">Referral</SelectItem>
                                            <SelectItem value="cold_outreach">Outreach</SelectItem>
                                            <SelectItem value="social_media">Social Media</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Private Notes</Label>
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button onClick={handleSave} disabled={isSaving} className="bg-[#E8A838] text-black hover:bg-[#d69628]">
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Quick Stats Grid */}
                            <div className="grid gap-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{selectedContact.email || 'No email provided'}</div>
                                        <div className="text-xs text-gray-500">Email Address</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{selectedContact.phone || 'No phone provided'}</div>
                                        <div className="text-xs text-gray-500">Phone Number</div>
                                    </div>
                                </div>
                                {selectedContact.city && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{selectedContact.city}</div>
                                            <div className="text-xs text-gray-500">Location</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Info Section */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">CRM Data</div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Added On</span>
                                        <span className="font-medium text-gray-900">{new Date(selectedContact.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-2"><Target className="h-4 w-4" /> Linked Deals</span>
                                        <span className="font-medium text-gray-900">{selectedContact._count?.deals || 0} Deals</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            {selectedContact.notes && (
                                <div>
                                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Private Notes</div>
                                    <div className="text-sm text-gray-700 bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 whitespace-pre-wrap">
                                        {selectedContact.notes}
                                    </div>
                                </div>
                            )}

                            {/* Danger Zone */}
                            <div className="pt-6 border-t border-gray-100 mt-auto">
                                <Button
                                    variant="outline"
                                    onClick={handleDelete}
                                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Contact
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
