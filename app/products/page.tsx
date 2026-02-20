'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/lib/i18n';

export default function ProductsOverview() {
    const { t } = useTranslation();

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title={t.productsOverview} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-lg border shadow-sm flex flex-col items-center justify-center text-center col-span-full py-12" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>{t.productsDashboard}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.futurePhaseMsg}</p>
                </div>
            </div>
        </div>
    );
}
