import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { getFinanceSummary } from '@/app/actions/finance/expenses';
import Link from 'next/link';

export default async function FinancePage() {
  const summary = await getFinanceSummary();

  const kpis = [
    { label: 'Total Revenue', value: summary.totalRevenue, color: '#22c55e', prefix: 'SAR ' },
    { label: 'Total Expenses', value: summary.totalExpenses, color: '#ef4444', prefix: 'SAR ' },
    { label: 'Net Profit', value: summary.netProfit, color: summary.netProfit >= 0 ? '#22c55e' : '#ef4444', prefix: 'SAR ' },
    { label: 'Profit Margin', value: summary.profitMargin, color: summary.profitMargin >= 0 ? '#22c55e' : '#ef4444', suffix: '%' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Finance Overview" />
        <Link href="/finance/expenses" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-colors">
          Manage Expenses
        </Link>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<div>Loading...</div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="p-5 rounded-xl border"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
              <p className="text-2xl font-bold" style={{ color: kpi.color }}>
                {kpi.prefix || ''}{typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : kpi.value}{kpi.suffix || ''}
              </p>
            </div>
          ))}
        </div>
      </Suspense>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Revenue Transactions</p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{summary.revenueCount}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Auto-created when orders are delivered</p>
        </div>
        <div className="p-5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Expense Records</p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{summary.expenseCount}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <Link href="/finance/expenses" className="underline hover:text-[var(--primary)]">View all expenses →</Link>
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h2>
        {summary.recentTransactions.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            No transactions yet. Revenue will appear automatically when orders are marked as delivered.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full">
              <thead style={{ background: 'var(--background)' }}>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Description</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Reference</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTransactions.map((txn: any) => (
                  <tr key={txn.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{txn.transactionId}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium text-white ${txn.type === 'revenue' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{txn.description}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${txn.type === 'revenue' ? 'text-green-500' : 'text-red-500'}`}>
                      {txn.type === 'revenue' ? '+' : '-'}SAR {txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{txn.referenceId || '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{new Date(txn.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
