import CompaniesClient from './CompaniesClient';
import { getCompanies } from '@/app/actions/crm/companies';
import { getPricingTiers } from '@/app/actions/pricing';
import { getCategories } from '@/app/actions/product/actions';
import { getBusinessContext } from '@/lib/getBusinessContext';

export const metadata = {
    title: 'Companies | CRM | Safcha Dashboard',
    description: 'Manage B2B companies and wholesale accounts',
};

export default async function CompaniesPage({ params }: { params: Promise<{ businessSlug: string }> }) {
    const { businessSlug } = await params;
    const ctx = await getBusinessContext();
    const [companies, tiers, categories] = await Promise.all([
        getCompanies(businessSlug),
        getPricingTiers(),
        getCategories()
    ]);

    return (
        <CompaniesClient
            initialCompanies={companies as any}
            initialTiers={tiers as any}
            initialCategories={categories as any}
            businessId={ctx.businessId}
            businessSlug={businessSlug}
        />
    );
}
