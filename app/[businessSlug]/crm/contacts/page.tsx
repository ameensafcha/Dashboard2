import ContactsClient from './ContactsClient';

export const metadata = {
    title: 'Contacts - Safcha',
    description: 'Manage individual clients, leads, and internal contacts.',
};

export default function ContactsPage() {
    return (
        <ContactsClient />
    );
}
