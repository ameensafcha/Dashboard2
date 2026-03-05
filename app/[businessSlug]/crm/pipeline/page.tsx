import { Metadata } from 'next';
import PipelineClient from './PipelineClient';
import { getDeals } from '@/app/actions/crm/deals';
import { getCompanies } from '@/app/actions/crm/companies';
import { getContacts } from '@/app/actions/crm/contacts';

export const metadata: Metadata = {
    title: 'Deals Pipeline | Safcha',
    description: 'Track and manage your sales CRM pipeline',
};

export default async function PipelinePage({ params }: { params: Promise<{ businessSlug: string }> }) {
    const { businessSlug } = await params;
    const [deals, companies, contacts] = await Promise.all([
        getDeals(businessSlug),
        getCompanies(businessSlug),
        getContacts(businessSlug)
    ]);

    return (
        <PipelineClient
            initialData={{
                deals: deals as any,
                companies: companies as any,
                contacts: contacts as any
            }}
            businessSlug={businessSlug}
        />
    );
}
