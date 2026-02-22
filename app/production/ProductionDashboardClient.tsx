'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { Factory, CheckCircle2, AlertTriangle, TrendingUp, ArrowRight, Activity, Clock, Box } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { ProductionBatchWithProduct } from '@/app/actions/production';
import { cn } from '@/lib/utils';

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
    const { t, isRTL } = useTranslation();

    const stats = [
        {
            title: t.activeBatches,
            value: activeBatches,
            sub: activeTrendText,
            icon: Factory,
            color: 'var(--primary)',
            bg: 'rgba(232, 168, 56, 0.08)'
        },
        {
            title: t.capacityUtilization,
            value: `${utilizationPercent}%`,
            sub: `${monthlyProductionKg} kg / ${maxCapacityKg} kg`,
            icon: TrendingUp,
            color: '#3b82f6',
            bg: 'rgba(59, 130, 246, 0.08)'
        },
        {
            title: t.pendingQC || 'Pending QC',
            value: batches.filter(b => b.status === 'quality_check').length,
            sub: 'Awaiting inspection',
            icon: CheckCircle2,
            color: '#10b981',
            bg: 'rgba(16, 185, 129, 0.08)'
        },
        {
            title: t.activeProducts,
            value: new Set(batches.map(b => b.productId)).size,
            sub: 'Unique items',
            icon: Activity,
            color: 'var(--primary)',
            bg: 'rgba(232, 168, 56, 0.08)'
        }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-10 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6", isRTL ? "sm:flex-row-reverse" : "")}>
                <PageHeader title={t.productionOverview} />
                <Link
                    href="/production/batches"
                    className="group bg-[#E8A838] text-black hover:bg-[#d69628] px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-[#E8A838]/20 active:scale-95 flex items-center gap-3"
                >
                    <Factory className="w-4 h-4 transition-transform group-hover:scale-110" />
                    {t.viewAddBatches}
                </Link>
            </div>

            {/* 1. Primary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="p-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                    >
                        <div className="absolute -bottom-2 -right-2 opacity-[0.02] group-hover:opacity-[0.04] group-hover:scale-110 transition-all duration-500">
                            <stat.icon size={64} />
                        </div>

                        <div className={cn("flex flex-col gap-4 relative z-10", isRTL ? "items-end" : "items-start")}>
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-[var(--background)] border border-[var(--border)] group-hover:border-[var(--primary)]/30 group-hover:shadow-[0_0_15px_rgba(232,168,56,0.1)]"
                            >
                                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                            </div>

                            <div className={cn("space-y-1", isRTL ? "text-right" : "")}>
                                <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{stat.value}</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)] opacity-80">{stat.title}</p>
                                <p className="text-[9px] font-medium text-[var(--text-muted)] tracking-tight">{stat.sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Production Queue Section */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden relative">
                <div className={cn("px-8 py-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--muted)]/20", isRTL ? "flex-row-reverse" : "")}>
                    <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                        <div className="w-1.5 h-6 bg-[#E8A838] rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                            {t.currentProductionQueue}
                        </h3>
                    </div>
                    <Link href="/production/batches" className="group text-[10px] text-[#E8A838] hover:text-[#d69628] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        {t.viewAll}
                        <ArrowRight className={cn("w-3.5 h-3.5 transition-transform group-hover:translate-x-1", isRTL ? "rotate-180 group-hover:translate-x-[-4px]" : "")} />
                    </Link>
                </div>

                <div className="divide-y divide-[var(--border)]">
                    {batches.slice(0, 6).map((batch) => (
                        <div key={batch.id} className={cn("p-6 hover:bg-[var(--muted)]/40 flex items-center justify-between transition-all group relative", isRTL ? "flex-row-reverse" : "")}>
                            <div className={cn("flex items-center gap-6", isRTL ? "flex-row-reverse" : "")}>
                                <div className="w-12 h-12 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--primary)]/30 transition-colors shadow-sm">
                                    <Box className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                                </div>
                                <div className={cn("space-y-1", isRTL ? "text-right" : "")}>
                                    <div className="font-mono text-[13px] font-black text-[var(--text-primary)] group-hover:text-[#E8A838] transition-colors tracking-tighter uppercase">
                                        {batch.batchNumber}
                                    </div>
                                    <div className="text-[13px] text-[var(--text-primary)] font-bold flex items-center gap-2">
                                        {batch.product?.name}
                                        {batch.product?.size && (
                                            <span className="text-[9px] bg-[var(--muted)] text-[var(--text-muted)] px-1.5 py-0.5 rounded font-black border border-[var(--border)] uppercase tracking-tight">
                                                {batch.product.size} {batch.product.unit || 'gm'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-disabled)] font-bold uppercase tracking-widest">
                                        <Clock className="w-3 h-3" />
                                        {new Date(batch.startDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className={cn("text-right flex items-center gap-8", isRTL ? "flex-row-reverse" : "")}>
                                <div className={cn("hidden sm:flex flex-col items-end gap-1", isRTL ? "items-start" : "")}>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t.targetQty}</span>
                                    <span className="text-sm font-black text-[var(--text-primary)]">{Number(batch.targetQty)} kg</span>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className={cn(
                                        "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border text-white transition-all transform group-hover:scale-105",
                                        batch.status === 'completed' ? 'bg-green-500/90 border-green-400/20' :
                                            batch.status === 'in_progress' ? 'bg-blue-500/90 border-blue-400/20 shadow-blue-500/10' :
                                                batch.status === 'quality_check' ? 'bg-amber-500/90 border-amber-400/20 shadow-amber-500/10' :
                                                    batch.status === 'failed' ? 'bg-red-500/90 border-red-400/20' :
                                                        'bg-gray-500/90 border-gray-400/20'
                                    )}>
                                        {t[batch.status as keyof typeof t] || batch.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {batches.length === 0 && (
                        <div className="p-20 text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--muted)]/30 border border-dashed border-[var(--border)]">
                                <Activity className="w-8 h-8 text-[var(--text-disabled)] opacity-20" />
                            </div>
                            <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                {t.noActiveProduction}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
