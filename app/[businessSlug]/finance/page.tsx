import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { getFinanceSummary } from '@/app/actions/finance/expenses';
import Link from 'next/link';
import { FinanceClient } from './FinanceClient';
import { translations } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const summary = await getFinanceSummary();
  // We don't have a server-side language hook here easily without more complex setup,
  // so we'll rely on the FinanceClient for internal i18n, but PageHeader can be handled
  // if we pass a default or use a generic title that's later localized.
  // For now, let's keep it simple.

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <Suspense fallback={<div className="h-96 flex items-center justify-center font-black text-[var(--text-disabled)] uppercase tracking-widest animate-pulse">Initializing financial data...</div>}>
        <FinanceClient summary={summary} />
      </Suspense>
    </div>
  );
}
