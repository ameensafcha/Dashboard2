import CompaniesClient from './CompaniesClient';

export const metadata = {
    title: 'Companies | CRM | Safcha Dashboard',
    description: 'Manage B2B companies and wholesale accounts',
};

export default function CRMCompaniesPage() {
    return <CompaniesClient />;
}
