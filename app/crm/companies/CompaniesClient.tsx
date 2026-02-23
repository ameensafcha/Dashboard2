'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, MapPin, Briefcase, User, Globe, ArrowRight, TrendingUp } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { getCompanies } from '@/app/actions/crm/companies';
import { getPricingTiers } from '@/app/actions/pricing';
import { getCategories } from '@/app/actions/product/actions';
import NewCompanyModal from './NewCompanyModal';
import CompanyDetailDrawer from './CompanyDetailDrawer';
import { Badge } from '@/components/ui/badge';
import { Company, CompanyPricingTier } from '@/stores/crmStore';
import { formatCurrency, cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

export default function CompaniesClient() {
    const { t, language, isRTL } = useTranslation();
    const router = useRouter();
    const {
        companies,
        setCompanies,
        setActiveTiers,
        setActiveCategories,
        setIsNewCompanyModalOpen,
        setSelectedCompany,
        setIsCompanyDrawerOpen
    } = useCrmStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async (search = '') => {
        setIsLoading(true);
        try {
            const [comps, tiers, cats] = await Promise.all([
                getCompanies(search),
                getPricingTiers(),
                getCategories()
            ]);
            setCompanies(comps as any);
            setActiveTiers(tiers as any);
            setActiveCategories(cats as any);
        } catch (error) {
            console.error('Error loading CRM data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData(searchTerm);
    };

    const handleRowClick = (company: Company) => {
        setSelectedCompany(company);
        setIsCompanyDrawerOpen(true);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
            <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6", isRTL ? "sm:flex-row-reverse" : "")}>
                <PageHeader title={language === 'ar' ? 'الشركات' : 'Companies'} />
                <Button
                    onClick={() => setIsNewCompanyModalOpen(true)}
                    className="bg-[#E8A838] text-black hover:bg-[#d69628] px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-[#E8A838]/20 active:scale-95 flex items-center gap-3"
                >
                    <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                    {language === 'ar' ? 'إضافة شركة' : 'Add Company'}
                </Button>
            </div>

            {/* Premium Table Container */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden relative transition-all">
                {/* Search Bar Wrapper */}
                <div className={cn("p-6 border-b border-[var(--border)] bg-[var(--muted)]/20", isRTL ? "flex justify-end" : "")}>
                    <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-md">
                        <div className="relative flex-1 group">
                            <Search className={cn("absolute top-3 h-4 w-4 text-[var(--text-disabled)] transition-colors group-focus-within:text-[var(--primary)]", isRTL ? "right-4" : "left-4")} />
                            <Input
                                type="search"
                                placeholder={language === 'ar' ? 'بحث...' : 'Search companies...'}
                                className={cn(
                                    "bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)] h-10 rounded-xl focus:ring-1 focus:ring-[var(--primary)] transition-all",
                                    isRTL ? "pr-11 text-right" : "pl-11"
                                )}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="outline"
                            className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl hover:bg-[var(--background)]"
                        >
                            {t.search}
                        </Button>
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-[0.2em] bg-[var(--muted)]/30 border-b border-[var(--border)]">
                            <tr className={isRTL ? "text-right" : ""}>
                                <th className="px-8 py-4">{language === 'ar' ? 'الشركة' : 'Company'}</th>
                                <th className="px-8 py-4">{language === 'ar' ? 'الصناعة' : 'Industry'}</th>
                                <th className="px-8 py-4">{language === 'ar' ? 'الموقع' : 'Location'}</th>
                                <th className="px-8 py-4">{language === 'ar' ? 'فئة التسعير' : 'Pricing Tier'}</th>
                                <th className="px-8 py-4">{language === 'ar' ? 'جهات الاتصال' : 'Contacts'}</th>
                                <th className={cn("px-8 py-4", isRTL ? "text-left" : "text-right")}>{language === 'ar' ? 'إجمالي المبيعات' : 'Lifetime Value'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <div className="w-10 h-10 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Loading records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : companies.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-16 h-16 rounded-2xl bg-[var(--muted)]/30 flex items-center justify-center border border-dashed border-[var(--border)]">
                                                <Building2 className="h-8 w-8 text-[var(--text-disabled)] opacity-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-[var(--text-primary)]">No companies found</p>
                                                <p className="text-xs text-[var(--text-muted)]">Register your first B2B client to start tracking deals.</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/5 font-black uppercase tracking-tighter text-[10px] mt-4"
                                                onClick={() => setIsNewCompanyModalOpen(true)}
                                            >
                                                Create First Company
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                companies.map((company) => (
                                    <tr
                                        key={company.id}
                                        className={cn(
                                            "hover:bg-[var(--muted)]/40 cursor-pointer transition-all group border-b border-[var(--border)]/30 last:border-0",
                                            isRTL ? "text-right" : ""
                                        )}
                                        onClick={() => handleRowClick(company)}
                                    >
                                        <td className="px-8 py-5">
                                            <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                                                <div className="w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--primary)]/30 transition-colors shadow-sm">
                                                    <Building2 className="w-5 h-5 text-[var(--text-disabled)] group-hover:text-[var(--primary)] transition-colors" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[14px] font-black text-[var(--text-primary)] group-hover:text-[#E8A838] transition-colors tracking-tight">
                                                        {company.name}
                                                    </div>
                                                    {company.website && (
                                                        <a
                                                            href={company.website}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={cn("flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors font-bold uppercase tracking-tighter", isRTL ? "flex-row-reverse" : "")}
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <Globe className="w-3 h-3" />
                                                            {new URL(company.website).hostname.replace('www.', '')}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {company.industry ? (
                                                <div className={cn("flex items-center gap-2 text-[var(--text-secondary)]", isRTL ? "flex-row-reverse" : "")}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/40" />
                                                    <span className="text-xs font-bold leading-none">{company.industry}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-disabled)] text-[10px] uppercase font-bold">—</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-[var(--text-secondary)]">
                                            {company.city ? (
                                                <div className={cn("flex items-center gap-1.5 text-xs font-bold", isRTL ? "flex-row-reverse" : "")}>
                                                    <MapPin className="h-3.5 w-3.5 text-[var(--text-disabled)]" />
                                                    <span>{company.city}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-disabled)] text-[10px] uppercase font-bold">—</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            {company.pricingTiers && company.pricingTiers.length > 0 ? (
                                                <div className={cn("flex flex-wrap gap-2", isRTL ? "justify-end" : "")}>
                                                    {company.pricingTiers.map((tier: CompanyPricingTier) => (
                                                        <span key={tier.id} className="text-[9px] bg-[var(--muted)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full font-black border border-[var(--border)] uppercase tracking-tight">
                                                            {tier.tierName}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-disabled)] text-[10px] font-bold uppercase tracking-widest">Standard</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div
                                                className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[#3b82f6] hover:bg-[#3b82f6]/5 hover:border-[#3b82f6]/30 transition-all group/contacts",
                                                    isRTL ? "flex-row-reverse" : ""
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/crm/contacts?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`);
                                                }}
                                            >
                                                <User className="h-4 w-4" />
                                                <span className="text-xs font-black leading-none">{company._count?.contacts || 0}</span>
                                                <ChevronSmallRight className={cn("w-3 h-3 opacity-0 group-hover/contacts:opacity-100 transition-all", isRTL ? "rotate-180" : "")} />
                                            </div>
                                        </td>
                                        <td className={cn("px-8 py-5", isRTL ? "text-left" : "text-right")}>
                                            <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "justify-end")}>
                                                <div className={cn("text-sm font-black text-[var(--text-primary)]", isRTL ? "text-left" : "text-right")}>
                                                    {formatCurrency(company.lifetimeValue)}
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

            <NewCompanyModal onCompanyAdded={() => loadData()} />
            <CompanyDetailDrawer />
        </div>
    );
}

function ChevronSmallRight({ className }: { className?: string }) {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M6.1584 3.1356C6.35366 2.94034 6.67024 2.94034 6.8655 3.1356L10.8655 7.1356C11.0608 7.33086 11.0608 7.64744 10.8655 7.8427L6.8655 11.8427C6.67024 12.038 6.35366 12.038 6.15841 11.8427C5.96314 11.6474 5.96314 11.3309 6.15841 11.1356L9.80486 7.48915L6.1584 3.8427C5.96314 3.64744 5.96314 3.33086 6.1584 3.1356Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
            ></path>
        </svg>
    );
}
