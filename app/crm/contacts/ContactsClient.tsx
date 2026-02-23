'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, MapPin, Building2, User, Mail, Phone, ArrowRight, ChevronRight, Globe } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { getContacts } from '@/app/actions/crm/contacts';
import { getCompanies } from '@/app/actions/crm/companies';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import NewContactModal from './NewContactModal';
import ContactDetailDrawer from './ContactDetailDrawer';
import { Contact } from '@/stores/crmStore';

function ContactsClientContent() {
    const { t, language, isRTL } = useTranslation();
    const searchParams = useSearchParams();
    const router = useRouter();

    const filterCompanyId = searchParams.get('companyId');
    const filterCompanyName = searchParams.get('companyName');

    const {
        contacts,
        setContacts,
        companies,
        setCompanies,
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
                getCompanies()
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

    const formatSource = (source: string) => {
        return source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'client': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'lead': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'supplier': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'partner': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'investor': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
            <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6", isRTL ? "sm:flex-row-reverse" : "")}>
                <PageHeader title={language === 'ar' ? 'جهات الاتصال' : 'Contacts'} />
                <Button
                    onClick={() => setIsNewContactModalOpen(true)}
                    className="bg-[#E8A838] text-black hover:bg-[#d69628] px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-[#E8A838]/20 active:scale-95 flex items-center gap-3"
                >
                    <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                    {language === 'ar' ? 'إضافة جهة اتصال' : 'Add Contact'}
                </Button>
            </div>

            {/* Premium Table Container */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden relative transition-all">
                {/* Search & Filter Bar Wrapper */}
                <div className={cn("p-6 border-b border-[var(--border)] bg-[var(--muted)]/20 flex flex-col sm:flex-row gap-4 justify-between", isRTL ? "sm:flex-row-reverse" : "")}>
                    <div className={cn("flex flex-col sm:flex-row gap-3 w-full flex-1", isRTL ? "sm:flex-row-reverse" : "")}>
                        <form onSubmit={handleSearch} className="relative w-full sm:max-w-md group">
                            <Search className={cn("absolute top-3 h-4 w-4 text-[var(--text-disabled)] transition-colors group-focus-within:text-[var(--primary)]", isRTL ? "right-4" : "left-4")} />
                            <Input
                                type="search"
                                placeholder={language === 'ar' ? 'بحث...' : 'Search contacts, email, company...'}
                                className={cn(
                                    "bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium",
                                    isRTL ? "pr-12 text-right" : "pl-12"
                                )}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoComplete="off"
                            />
                        </form>

                        <div className="w-full sm:w-[240px]">
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
                                <SelectTrigger className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl focus:ring-1 focus:ring-[var(--primary)] font-bold uppercase tracking-tight text-[10px]">
                                    <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                        <Building2 className="w-3.5 h-3.5 opacity-50 text-[var(--text-muted)]" />
                                        <SelectValue placeholder="All Companies" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                    <SelectItem value="all" className="text-xs font-bold">All Companies</SelectItem>
                                    {companies.map(company => (
                                        <SelectItem key={company.id} value={company.id} className="text-xs font-bold">
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-[0.2em] bg-[var(--muted)]/30 border-b border-[var(--border)]">
                            <tr className={isRTL ? "text-right" : ""}>
                                <th className="px-8 py-4">{language === 'ar' ? 'جهة الاتصال' : 'Contact'}</th>
                                <th className="px-8 py-4">{language === 'ar' ? 'الشركة / الدور' : 'Company / Role'}</th>
                                <th className="px-8 py-4">{language === 'ar' ? 'النوع / المصدر' : 'Type / Source'}</th>
                                <th className="px-8 py-4">{language === 'ar' ? 'الموقع' : 'Location'}</th>
                                <th className={cn("px-8 py-4", isRTL ? "text-left" : "text-right")}>{language === 'ar' ? 'الصفقات' : 'Deals'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <div className="w-10 h-10 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Loading contacts...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-16 h-16 rounded-2xl bg-[var(--muted)]/30 flex items-center justify-center border border-dashed border-[var(--border)]">
                                                <User className="h-8 w-8 text-[var(--text-disabled)] opacity-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-[var(--text-primary)]">No contacts found</p>
                                                <p className="text-xs text-[var(--text-muted)]">Building relationships is key to success.</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/5 font-black uppercase tracking-tighter text-[10px] mt-4"
                                                onClick={() => setIsNewContactModalOpen(true)}
                                            >
                                                Register Contact
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                contacts.map((contact) => (
                                    <tr
                                        key={contact.id}
                                        className={cn(
                                            "hover:bg-[var(--muted)]/40 cursor-pointer transition-all group border-b border-[var(--border)]/30 last:border-0",
                                            isRTL ? "text-right" : ""
                                        )}
                                        onClick={() => handleRowClick(contact)}
                                    >
                                        <td className="px-8 py-5">
                                            <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                                                <div className="w-11 h-11 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--primary)]/30 transition-colors shadow-sm overflow-hidden uppercase font-black text-xs text-[var(--text-disabled)] group-hover:text-[var(--primary)]">
                                                    {contact.name.substring(0, 2)}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[14px] font-black text-[var(--text-primary)] group-hover:text-[#E8A838] transition-colors tracking-tight">
                                                        {contact.name}
                                                    </div>
                                                    <div className={cn("flex flex-col gap-0.5", isRTL ? "items-end" : "items-start")}>
                                                        {contact.email && (
                                                            <div className={cn("flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter", isRTL ? "flex-row-reverse" : "")}>
                                                                <Mail className="w-3 h-3 opacity-50" />
                                                                {contact.email}
                                                            </div>
                                                        )}
                                                        {contact.phone && (
                                                            <div className={cn("flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter", isRTL ? "flex-row-reverse" : "")}>
                                                                <Phone className="w-3 h-3 opacity-50" />
                                                                {contact.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={cn("flex flex-col gap-1", isRTL ? "items-end" : "items-start")}>
                                                <div className={cn("flex items-center gap-2 font-black text-xs text-[var(--text-primary)]", isRTL ? "flex-row-reverse" : "")}>
                                                    <Building2 className="h-3.5 w-3.5 text-[var(--primary)]/60" />
                                                    {contact.company?.name || <span className="opacity-40 italic font-medium">Independent</span>}
                                                </div>
                                                {contact.role && (
                                                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                                                        {contact.role}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={cn("flex flex-col gap-2", isRTL ? "items-end" : "items-start")}>
                                                <Badge variant="outline" className={cn("font-black uppercase text-[9px] tracking-widest border-0 py-0.5 px-2.5", getTypeStyles(contact.type))}>
                                                    {contact.type}
                                                </Badge>
                                                {contact.source && (
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)]">
                                                        Via: {formatSource(contact.source)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-[var(--text-secondary)]">
                                            {contact.city ? (
                                                <div className={cn("flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[var(--background)] border border-[var(--border)]", isRTL ? "flex-row-reverse" : "inline-flex")}>
                                                    <MapPin className="h-3.5 w-3.5 text-[var(--text-disabled)]" />
                                                    <span>{contact.city}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-disabled)] text-[10px] uppercase font-bold tracking-widest">—</span>
                                            )}
                                        </td>
                                        <td className={cn("px-8 py-5", isRTL ? "text-left" : "text-right")}>
                                            <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "justify-end")}>
                                                <div className={cn("text-sm font-black text-[var(--text-primary)]", isRTL ? "text-left" : "text-right")}>
                                                    {contact._count?.deals || 0}
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                    <ArrowRight className={cn("w-4 h-4 text-[var(--primary)]", isRTL ? "rotate-180" : "")} />
                                                </div>
                                            </div>
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
            <div className="p-4 sm:p-6 lg:p-10 flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-4 opacity-40">
                    <div className="w-10 h-10 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">Loading workspace...</p>
                </div>
            </div>
        }>
            <ContactsClientContent />
        </Suspense>
    );
}
