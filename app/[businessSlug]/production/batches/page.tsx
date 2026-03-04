import { Suspense } from 'react';
import BatchesClient from './BatchesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Production Batches - Safcha Dashboard',
  description: 'Manage and track production batches',
};

export default function ProductionBatchesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading Batches...</div>}>
      <BatchesClient />
    </Suspense>
  );
}
