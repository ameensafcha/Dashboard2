'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, MapPin, Building2, User, Mail, Phone } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { getContacts } from '@/app/actions/crm/contacts';
import { getCompanies } from '@/app/actions/crm/companies';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import NewContactModal from './NewContactModal';
import ContactDetailDrawer from './ContactDetailDrawer';
import { Contact } from '@/stores/crmStore';

function ContactsClientContent() {
    const { language } = useTranslation();
    const searchParams = useSearchParams();
    const router = useRouter();

    const filterCompanyId = searchParams.get('companyId');
    const filterCompanyName = searchParams.get('companyName');
    const {
        contacts,
        setContacts,
        companies,
        setCompanies, // Need companies for the dropdown in NewContactModal
        setIsNewContactModalOpen,
        setSelectedContact,
        setIsContactDrawerOpen
    } = useCrmStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async (search = '', compId = filterCompanyId || undefined) => {
        setIsLoading(true);
        try {
            const [contactsData, companiesData] = await Promise.all([
                getContacts(search, compId),
                getCompanies() // Need companies for linking contacts
            ]);
            setContacts(contactsData as any);
            setCompanies(companiesData as any);
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData(searchTerm);
    };

    const handleRowClick = (contact: Contact) => {
        setSelectedContact(contact);
        setIsContactDrawerOpen(true);
    };

    // Helper to format source nicely
    const formatSource = (source: string) => {
        return source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Helper to color code client types
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'client': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'lead': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'supplier': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'partner': return 'bg-green-50 text-green-700 border-green-200';
            case 'investor': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader title="Contacts" />
                <Button
                    onClick={() => setIsNewContactModalOpen(true)}
                    className="bg-[#E8A838] hover:bg-[#d69628] text-black w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-2" /> Add Contact
                </Button>
            </div>

            <div className="rounded-lg shadow-sm border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col sm:flex-row gap-3 w-full flex-1">
                        <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            <Input
                                placeholder="Search contacts, email, company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                                style={{ background: 'var(--background)', color: 'var(--foreground)' }}
                            />
                        </form>

                        <div className="w-full sm:w-[220px]">
                            <Select
                                value={filterCompanyId || "all"}
                                onValueChange={(val) => {
                                    if (val === "all") {
                                        router.push('/crm/contacts');
                                        setTimeout(() => loadData(searchTerm, undefined), 50);
                                    } else {
                                        const comp = companies.find(c => c.id === val);
                                        if (comp) {
                                            router.push(`/crm/contacts?companyId=${comp.id}&companyName=${encodeURIComponent(comp.name)}`);
                                            setTimeout(() => loadData(searchTerm, comp.id), 50);
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                                    <SelectValue placeholder="All Companies" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] max-h-[16rem] z-[100]">
                                    <SelectItem value="all">All Companies</SelectItem>
                                    {companies.map(company => (
                                        <SelectItem key={company.id} value={company.id}>
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase border-b" style={{ background: 'var(--muted)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                            <tr>
                                <th className="px-6 py-3">Contact</th>
                                <th className="px-6 py-3">Company / Role</th>
                                <th className="px-6 py-3">Status / Type</th>
                                <th className="px-6 py-3">Location</th>
                                <th className="px-6 py-3 text-right">Deals</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                                        Loading contacts...
                                    </td>
                                </tr>
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                                        <div className="flex flex-col items-center justify-center">
                                            <User className="h-10 w-10 mb-2 opacity-50" />
                                            <p>No contacts found</p>
                                            <Button variant="link" onClick={() => setIsNewContactModalOpen(true)}>
                                                Create your first contact
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                contacts.map((contact) => (
                                    <tr
                                        key={contact.id}
                                        className="border-b cursor-pointer transition-colors hover:bg-[var(--muted)]"
                                        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                                        onClick={() => handleRowClick(contact)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium" style={{ color: 'var(--foreground)' }}>{contact.name}</div>
                                            <div className="text-xs mt-1 flex flex-col gap-0.5" style={{ color: 'var(--text-muted)' }}>
                                                {contact.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {contact.email}
                                                    </span>
                                                )}
                                                {contact.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {contact.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--foreground)' }}>
                                                <Building2 className="h-3.5 w-3.5 opacity-50" />
                                                {contact.company?.name || <span className="italic" style={{ color: 'var(--text-secondary)' }}>Independent</span>}
                                            </div>
                                            {contact.role && (
                                                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                    {contact.role}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <Badge variant="outline" className={`text-xs ${getTypeColor(contact.type)}`}>
                                                    {contact.type.toUpperCase()}
                                                </Badge>
                                                {contact.source && (
                                                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                                        Source: {formatSource(contact.source)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4" style={{ color: 'var(--foreground)' }}>
                                            {contact.city ? (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 opacity-50" />
                                                    <span>{contact.city}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-medium" style={{ color: 'var(--foreground)' }}>{contact._count?.deals || 0}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <NewContactModal onContactAdded={() => loadData()} />
            <ContactDetailDrawer onContactUpdated={() => loadData()} />
        </div>
    );
}

export default function ContactsClient() {
    return (
        <Suspense fallback={
            <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Loading pipeline...</div>
            </div>
        }>
            <ContactsClientContent />
        </Suspense>
    );
}
