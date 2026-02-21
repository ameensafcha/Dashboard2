import { Suspense } from 'react';
import { getQualityChecks } from '@/app/actions/production';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import QualityPageClient from './QualityPageClient';

export const metadata = {
  title: 'Quality Control - Safcha Dashboard',
  description: 'Quality control checks and inspections',
};

export default async function QualityControlPage() {
  const checks = await getQualityChecks();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader title="Quality Control" />
      <Suspense fallback={<div>Loading...</div>}>
        <QualityPageClient initialChecks={checks} />
      </Suspense>
    </div>
  );
}
