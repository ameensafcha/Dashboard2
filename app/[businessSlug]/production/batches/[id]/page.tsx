import { getProductionBatchById } from '@/app/actions/production';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BatchDetailsClient } from './BatchDetailsClient';

export default async function BatchDetailsPage({ params }: { params: Promise<{ id: string; businessSlug: string }> }) {
    const { id, businessSlug } = await params;
    const batch = await getProductionBatchById(id);

    if (!batch) {
        return (
            <div className="p-8 text-center bg-[var(--card)] rounded-xl border border-[var(--border)] m-6">
                <PageHeader title="Batch Not Found" />
                <Link href={`/${businessSlug}/production/batches`} className="text-[#E8A838] group flex items-center justify-center gap-2 mt-6 font-bold hover:underline">
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Batches
                </Link>
            </div>
        );
    }

    return <BatchDetailsClient batch={batch} businessSlug={businessSlug} />;
}
