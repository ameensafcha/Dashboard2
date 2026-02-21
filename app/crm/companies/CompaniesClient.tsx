'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, MapPin, Briefcase, User } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { getCompanies } from '@/app/actions/crm/companies';
import { getPricingTiers } from '@/app/actions/pricing';
import { getCategories } from '@/app/actions/product/actions';
import NewCompanyModal from './NewCompanyModal';
import CompanyDetailDrawer from './CompanyDetailDrawer';
import { Badge } from '@/components/ui/badge';
import { Company, CompanyPricingTier } from '@/stores/crmStore';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

export default function CompaniesClient() {
    const { language } = useTranslation();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader title={language === 'ar' ? 'الشركات' : 'Companies'} />
                <Button
                    onClick={() => setIsNewCompanyModalOpen(true)}
                    className="bg-[#E8A838] text-black hover:bg-[#d69628]"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'إضافة شركة' : 'Add Company'}
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="search"
                                placeholder={language === 'ar' ? 'بحث...' : 'Search companies...'}
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button type="submit" variant="outline">Search</Button>
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Company</th>
                                <th className="px-6 py-3">Industry</th>
                                <th className="px-6 py-3">Location</th>
                                <th className="px-6 py-3">Pricing Tier</th>
                                <th className="px-6 py-3">Contacts</th>
                                <th className="px-6 py-3 text-right">Lifetime Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Loading companies...
                                    </td>
                                </tr>
                            ) : companies.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Building2 className="h-10 w-10 text-gray-300 mb-2" />
                                            <p>No companies found</p>
                                            <Button variant="link" onClick={() => setIsNewCompanyModalOpen(true)}>
                                                Create your first company
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                companies.map((company) => (
                                    <tr
                                        key={company.id}
                                        className="bg-white border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleRowClick(company)}
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {company.name}
                                            {company.website && (
                                                <a href={company.website} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                                                    {new URL(company.website).hostname}
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {company.industry ? (
                                                <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-2 py-0.5 w-fit">
                                                    <Briefcase className="h-3 w-3" />
                                                    <span className="text-xs">{company.industry}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {company.city ? (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{company.city}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {company.pricingTiers && company.pricingTiers.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {company.pricingTiers.map((tier: CompanyPricingTier) => (
                                                        <Badge key={tier.id} variant="outline" className={`text-xs ${tier.marginPercent >= 90 ? 'text-green-700 bg-green-50 border-green-200' : 'text-yellow-700 bg-yellow-50 border-yellow-200'}`}>
                                                            {tier.categoryName}: {tier.tierName}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Standard Retail</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div
                                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/crm/contacts?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`);
                                                }}
                                                title={`View all contacts for ${company.name}`}
                                            >
                                                <User className="h-3.5 w-3.5" />
                                                {company._count?.contacts || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            {formatCurrency(company.lifetimeValue)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <NewCompanyModal onCompanyAdded={() => loadData()} />
        </div>
    );
}
