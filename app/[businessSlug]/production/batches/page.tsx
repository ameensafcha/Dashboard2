import { Suspense } from 'react';
import BatchesClient from './BatchesClient';
import { getProductionBatches, getCapacityStatus } from '@/app/actions/production';
import { getProducts } from '@/app/actions/product/actions';
import { getRawMaterials } from '@/app/actions/inventory/raw-materials';


export const metadata = {
  title: 'Production Batches - Safcha Dashboard',
  description: 'Manage and track production batches',
};

export default async function ProductionBatchesPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const [batches, productsResp, rmResp, capacity] = await Promise.all([
    getProductionBatches(businessSlug),
    getProducts({ page: 1, limit: 100, search: '', status: '' }),
    getRawMaterials(),
    getCapacityStatus(),
  ]);

  const initialData = {
    batches,
    products: productsResp.products || [],
    rawMaterials: rmResp.success && 'materials' in rmResp ? rmResp.materials.map((m: any) => ({ id: m.id, name: m.name, currentStock: m.currentStock })) : [],
    capacity
  };

  return (
    <Suspense fallback={<div className="p-6">Loading Batches...</div>}>
      <BatchesClient initialData={initialData} />
    </Suspense>
  );
}
