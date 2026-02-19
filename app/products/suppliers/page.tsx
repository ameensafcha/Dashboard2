import { Suspense } from 'react';
import { getSuppliers, Supplier } from '@/app/actions/suppliers';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
          <p className="text-gray-500">No suppliers yet</p>
          <Button className="mt-4 bg-[#E8A838] hover:bg-[#d49a2d] text-black">
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
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
                <tr key={supplier.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{supplier.name}</td>
                  <td className="px-4 py-3">{supplier.contactPerson || '-'}</td>
                  <td className="px-4 py-3">{supplier.email || '-'}</td>
                  <td className="px-4 py-3">{supplier.phone || '-'}</td>
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
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Suppliers</h1>
          <p className="text-gray-500 mt-1">Manage your raw material suppliers</p>
        </div>
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
