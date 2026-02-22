import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { getExpenses } from '@/app/actions/finance/expenses';
import ExpensesClient from './ExpensesClient';

export default async function ExpensesPage() {
    const expenses = await getExpenses();

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="Expenses" />
            <Suspense fallback={<div>Loading...</div>}>
                <ExpensesClient initialExpenses={expenses as any} />
            </Suspense>
        </div>
    );
}
