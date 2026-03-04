import { Metadata } from 'next';
import SuppliersClient from './SuppliersClient';
import { getSuppliers } from '@/app/actions/suppliers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Suppliers - Safcha Dashboard',
  description: 'Manage raw material and packaging suppliers.',
};

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="p-4 sm:p-6">
      <SuppliersClient initialSuppliers={suppliers} />
    </div>
  );
}
