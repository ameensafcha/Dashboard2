import ContactsClient from './ContactsClient';
import { getContacts } from '@/app/actions/crm/contacts';
import { getCompanies } from '@/app/actions/crm/companies';

export const metadata = {
    title: 'Contacts - Safcha',
    description: 'Manage individual clients, leads, and internal contacts.',
};

export default async function ContactsPage() {
    const [contacts, companies] = await Promise.all([
        getContacts(),
        getCompanies()
    ]);

    return (
        <ContactsClient
            initialContacts={contacts as any}
            initialCompanies={companies as any}
        />
    );
}
