import { getProductionBatchById } from '@/app/actions/production';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BatchDetailsClient } from './BatchDetailsClient';

export default async function BatchDetailsPage({ params }: { params: { id: string } }) {
    // This is a server component, we need to pass t or use it inside a client sub-component if we want dynamic.
    // However, the page structure here is static enough for server rendering with fixed keys if needed, 
    // but the task requires i18n. I'll make the main layout here but wrap strings.
    // Actually, I can use a Client component for the translations if I want it truly dynamic, 
    // or just fetch translations on the server.
    // For now, I'll keep the server component but use hardcoded keys that match i18n.ts if I can't use the hook.
    // Wait, useTranslation is a client hook. I'll refactor this page into a Client Component to use the hook easily,
    // OR I just pass the batch to a Client wrapper.

    // Let's refactor to a Client Wrapper for the UI part to keep it simple with the current i18n system.
    const batch = await getProductionBatchById(params.id);

    if (!batch) {
        return (
            <div className="p-8 text-center bg-[var(--card)] rounded-xl border border-[var(--border)] m-6">
                <PageHeader title="Batch Not Found" />
                <Link href="/production/batches" className="text-[#E8A838] group flex items-center justify-center gap-2 mt-6 font-bold hover:underline">
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Batches
                </Link>
            </div>
        );
    }

    return <BatchDetailsClient batch={batch} />;
}

// Separate Client component for the refined UI with i18n
// Import is at the top
