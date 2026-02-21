'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, MapPin, Building2, User, Mail, Phone } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { getContacts } from '@/app/actions/crm/contacts';
import { getCompanies } from '@/app/actions/crm/companies';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import NewContactModal from './NewContactModal';
import ContactDetailDrawer from './ContactDetailDrawer';
import { Contact } from '@/stores/crmStore';

export default function ContactsClient() {
    const { language } = useTranslation();
    const {
        contacts,
        setContacts,
        setCompanies, // Need companies for the dropdown in NewContactModal
        setIsNewContactModalOpen,
        setSelectedContact,
        setIsContactDrawerOpen
    } = useCrmStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async (search = '') => {
        setIsLoading(true);
        try {
            const [contactsData, companiesData] = await Promise.all([
                getContacts(search),
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search contacts, email, company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
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
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Loading contacts...
                                    </td>
                                </tr>
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <User className="h-10 w-10 text-gray-300 mb-2" />
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
                                        className="bg-white border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleRowClick(contact)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{contact.name}</div>
                                            <div className="text-gray-500 text-xs mt-1 flex flex-col gap-0.5">
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
                                            <div className="flex items-center gap-1.5 font-medium text-gray-900">
                                                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                                {contact.company?.name || <span className="text-gray-400 italic">Independent</span>}
                                            </div>
                                            {contact.role && (
                                                <div className="text-gray-500 text-xs mt-1">
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
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                                                        Source: {formatSource(contact.source)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {contact.city ? (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>{contact.city}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-medium text-gray-900">{contact._count?.deals || 0}</div>
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
