import { Suspense } from 'react';
import { getSuppliers, Supplier } from '@/app/actions/suppliers';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata = {
  title: 'Suppliers - Safcha Dashboard',
  description: 'Manage your suppliers',
};

async function SuppliersList() {
  const suppliers = await getSuppliers();
  
  return (
    <div>
      {suppliers.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-muted)' }}>No suppliers yet</p>
          <Button className="mt-4 bg-[#E8A838] hover:bg-[#d49a2d] text-black">
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <table className="w-full">
            <thead style={{ background: 'var(--muted)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Contact Person</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{supplier.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{supplier.contactPerson || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{supplier.email || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{supplier.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge className={supplier.isActive ? 'bg-[#2D6A4F] text-white' : 'bg-gray-400 text-white'}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function SuppliersPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Suppliers" />

      <div className="mb-4 flex justify-end">
        <Button className="bg-[#E8A838] hover:bg-[#d49a2d] text-black">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SuppliersList />
      </Suspense>
    </div>
  );
}
