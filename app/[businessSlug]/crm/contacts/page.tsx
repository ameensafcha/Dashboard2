import ContactsClient from './ContactsClient';
import { getContacts } from '@/app/actions/crm/contacts';
import { getCompanies } from '@/app/actions/crm/companies';
import { getBusinessContext } from '@/lib/getBusinessContext';

export const metadata = {
    title: 'Contacts - Safcha',
    description: 'Manage individual clients, leads, and internal contacts.',
};

export default async function ContactsPage({ params }: { params: Promise<{ businessSlug: string }> }) {
    const { businessSlug } = await params;
    const ctx = await getBusinessContext();
    const [contacts, companies] = await Promise.all([
        getContacts(businessSlug),
        getCompanies(businessSlug)
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
