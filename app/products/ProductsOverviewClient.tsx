'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/lib/i18n';
import { Coffee, Layers, CheckCircle, Activity } from 'lucide-react';

interface ProductsOverviewData {
    totalProducts: number;
    totalCategories: number;
    activeCount: number;
    sfdaApprovedCount: number;
}

export default function ProductsOverviewClient({ data }: { data: ProductsOverviewData }) {
    const { t } = useTranslation();

    const stats = [
        {
            title: t.totalProducts || 'Total Products',
            value: data.totalProducts,
            icon: Coffee,
            color: 'var(--accent-gold)'
        },
        {
            title: t.categories || 'Categories',
            value: data.totalCategories,
            icon: Layers,
            color: 'var(--accent-blue, #3b82f6)'
        },
        {
            title: t.sfdaApproved || 'SFDA Approved',
            value: data.sfdaApprovedCount,
            icon: CheckCircle,
            color: 'var(--accent-green)'
        },
        {
            title: t.activeProducts || 'Active Products',
            value: data.activeCount,
            icon: Activity,
            color: 'var(--accent-gold)'
        }
    ];

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title={t.productsOverview} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className="p-6 rounded-xl border shadow-sm transition-all hover:shadow-md"
                        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{stat.title}</p>
                                <h3 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{stat.value}</h3>
                            </div>
                            <div
                                className="p-3 rounded-lg"
                                style={{ background: `rgba(${stat.color === 'var(--accent-gold)' ? '232, 168, 56' : '45, 106, 79'}, 0.1)` }}
                            >
                                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div
                className="p-12 rounded-xl border border-dashed flex flex-col items-center justify-center text-center"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Coffee className="w-8 h-8 opacity-20" />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>{t.productsDashboard}</h3>
                <p className="max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t.futurePhaseMsg || 'More detailed analytics and trends will be available in future updates.'}
                </p>
            </div>
        </div>
    );
}
