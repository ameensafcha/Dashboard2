import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { getTransactions } from '@/app/actions/finance/expenses';
import TransactionsClient from './TransactionsClient';

export default async function TransactionsPage() {
    const data = await getTransactions(1, 100);

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
            <Suspense fallback={<div>Loading...</div>}>
                <TransactionsClient initialData={data} />
            </Suspense>
        </div>
    );
}
