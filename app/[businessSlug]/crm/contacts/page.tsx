import ContactsClient from './ContactsClient';
import { getContacts } from '@/app/actions/crm/contacts';
import { getCompanies } from '@/app/actions/crm/companies';
import { getBusinessContext } from '@/lib/getBusinessContext';

export const metadata = {
    title: 'Contacts - Safcha',
    description: 'Manage individual clients, leads, and internal contacts.',
};

export default async function ContactsPage({
    params,
    searchParams
}: {
    params: Promise<{ businessSlug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { businessSlug } = await params;
    const resolvedSearchParams = await searchParams;
    const companyId = typeof resolvedSearchParams.companyId === 'string' ? resolvedSearchParams.companyId : undefined;

    const ctx = await getBusinessContext();
    const [contacts, companies] = await Promise.all([
        getContacts(undefined, undefined, companyId),
        getCompanies()
    ]);

    return (
        <ContactsClient
            initialContacts={contacts as any}
            initialCompanies={companies as any}
            businessId={ctx.businessId}
            businessSlug={businessSlug}
        />
    );
}

