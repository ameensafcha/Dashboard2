import { Suspense } from 'react';
import { getQualityChecks } from '@/app/actions/production';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Quality Control - Safcha Dashboard',
  description: 'Quality control checks',
};

import { QualityCheck, ProductionBatch, Product } from '@prisma/client';

type CheckItem = QualityCheck & {
  batch: ProductionBatch & {
    product: Pick<Product, 'id' | 'name'> | null;
  };
};

function QualityChecksList({ checks }: { checks: CheckItem[] }) {
  return (
    <div>
      {checks.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-muted)' }}>No quality checks yet</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <table className="w-full">
            <thead style={{ background: 'var(--muted)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Batch</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Visual</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Weight</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Taste</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">SFDA</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{check.batch?.batchNumber}</td>
                  <td className="px-4 py-3">
                    <Badge className={check.visualInspection === 'pass' ? 'bg-green-500' : 'bg-red-500'}>
                      {check.visualInspection}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={check.weightVerification === 'pass' ? 'bg-green-500' : 'bg-red-500'}>
                      {check.weightVerification}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={check.tasteTest === 'pass' ? 'bg-green-500' : 'bg-red-500'}>
                      {check.tasteTest}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={check.sfdaCompliance === 'pass' ? 'bg-green-500' : 'bg-red-500'}>
                      {check.sfdaCompliance}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{check.overallScore}/10</td>
                  <td className="px-4 py-3">
                    <Badge className={check.passed ? 'bg-green-500' : 'bg-red-500'}>
                      {check.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                    {new Date(check.checkedAt).toLocaleDateString()}
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

export default async function QualityControlPage() {
  const checks = await getQualityChecks();

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader title="Quality Control History" />
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <QualityChecksList checks={checks} />
      </Suspense>
    </div>
  );
}
