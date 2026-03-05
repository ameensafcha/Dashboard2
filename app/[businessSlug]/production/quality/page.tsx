import { Suspense } from 'react';
import { getQualityChecks } from '@/app/actions/production';
import QualityPageClient from './QualityPageClient';


export const metadata = {
  title: 'Quality Control - Safcha Dashboard',
  description: 'Quality control checks and inspections',
};

export default async function QualityControlPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const checks = await getQualityChecks(businessSlug);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <QualityPageClient initialChecks={checks} />
      </Suspense>
    </div>
  );
}
