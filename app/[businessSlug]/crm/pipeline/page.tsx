import { Metadata } from 'next';
import PipelineClient from './PipelineClient';
import { getDeals } from '@/app/actions/crm/deals';
import { getCompanies } from '@/app/actions/crm/companies';
import { getContacts } from '@/app/actions/crm/contacts';

export const metadata: Metadata = {
    title: 'Deals Pipeline | Safcha',
    description: 'Track and manage your sales CRM pipeline',
};


export default async function PipelinePage() {
    const [deals, companies, contacts] = await Promise.all([
        getDeals(),
        getCompanies(),
        getContacts()
    ]);

    return (
        <PipelineClient
            initialDeals={deals as any}
            initialCompanies={companies as any}
            initialContacts={contacts as any}
        />
    );
}
