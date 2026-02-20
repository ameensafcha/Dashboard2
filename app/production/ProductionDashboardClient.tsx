'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { Factory, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { ProductionBatchWithProduct } from '@/app/actions/production';

interface ProductionDashboardClientProps {
    batches: ProductionBatchWithProduct[];
    activeBatches: number;
    utilizationPercent: number;
    monthlyProductionKg: number;
    maxCapacityKg: number;
    activeTrendText: string;
    activeTrend: 'up' | 'down' | 'neutral';
}

export default function ProductionDashboardClient({
    batches,
    activeBatches,
    utilizationPercent,
    monthlyProductionKg,
    maxCapacityKg,
    activeTrendText,
    activeTrend
}: ProductionDashboardClientProps) {
    const { t } = useTranslation();

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader title={t.productionOverview} />
                <Link href="/production/batches" className="bg-[#E8A838] text-black hover:bg-[#d69628] px-4 py-2 rounded-md font-medium text-sm transition-colors decoration-transparent text-center">
                    {t.viewAddBatches}
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KPICard
                    title={t.activeBatches}
                    value={activeBatches.toString()}
                    change={activeTrendText}
                    trend={activeTrend}
                    icon={Factory}
                />
                <KPICard
                    title={t.capacityUtilization}
                    value={`${utilizationPercent}%`}
                    change={`${monthlyProductionKg} kg / ${maxCapacityKg} kg max`}
                    trend={utilizationPercent > 90 ? "up" : "neutral"}
                    icon={TrendingUp}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-medium text-gray-900">{t.currentProductionQueue}</h3>
                        <Link href="/production/batches" className="text-sm text-[#E8A838] hover:underline font-medium decoration-transparent">
                            {t.viewAll}
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {batches.slice(0, 5).map((batch) => (
                            <div key={batch.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-900">{batch.batchNumber}</div>
                                    <div className="text-sm text-gray-500">
                                        {batch.product?.name}
                                        {batch.product?.size ? <span className="text-xs ml-1 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">{batch.product.size} {batch.product.unit || 'gm'}</span> : ''}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                    ${batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            batch.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                batch.status === 'quality_check' ? 'bg-yellow-100 text-yellow-800' :
                                                    batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'}`}
                                    >
                                        {batch.status.replace('_', ' ')}
                                    </span>
                                    <div className="text-sm text-gray-500 mt-1">{Number(batch.targetQty)} kg</div>
                                </div>
                            </div>
                        ))}
                        {batches.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                {t.noActiveProduction}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
