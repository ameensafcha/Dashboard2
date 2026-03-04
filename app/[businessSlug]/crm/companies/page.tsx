import CompaniesClient from './CompaniesClient';
import { getCompanies } from '@/app/actions/crm/companies';
import { getPricingTiers } from '@/app/actions/pricing';
import { getCategories } from '@/app/actions/product/actions';

export const metadata = {
    title: 'Companies | CRM | Safcha Dashboard',
    description: 'Manage B2B companies and wholesale accounts',
};

export default async function CRMCompaniesPage() {
    const [companies, tiers, categories] = await Promise.all([
        getCompanies(),
        getPricingTiers(),
        getCategories()
    ]);

    return (
        <CompaniesClient
            initialCompanies={companies as any}
            initialTiers={tiers as any}
            initialCategories={categories as any}
        />
    );
}
