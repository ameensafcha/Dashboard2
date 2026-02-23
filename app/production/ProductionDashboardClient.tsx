'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { Factory, CheckCircle2, TrendingUp, ArrowRight, Activity, Clock, Box, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { ProductionBatchWithProduct } from '@/app/actions/production';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

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
            icon: <Factory className="w-5 h-5 text-[var(--primary)]" />,
            color: "text-[var(--primary)]",
            bg: "bg-[var(--primary)]/5",
            border: "border-[var(--primary)]/10"
        },
        {
            title: t.capacityUtilization,
            value: `${utilizationPercent}%`,
            sub: `${monthlyProductionKg.toLocaleString()} / ${maxCapacityKg.toLocaleString()} kg`,
            icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
            color: "text-blue-400",
            bg: "bg-blue-400/5",
            border: "border-blue-400/10"
        },
        {
            title: t.pendingQC || 'Pending QC',
            value: batches.filter(b => b.status === 'quality_check').length,
            sub: 'Awaiting inspection',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
            color: "text-emerald-400",
            bg: "bg-emerald-400/5",
            border: "border-emerald-400/10"
        },
        {
            title: t.activeProducts,
            value: new Set(batches.map(b => b.productId)).size,
            sub: 'Unique items in cycle',
            icon: <Activity className="w-5 h-5 text-amber-500" />,
            color: "text-amber-500",
            bg: "bg-amber-400/5",
            border: "border-amber-400/10"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                        {t.productionOverview}
                    </h1>
                    <p className="text-sm text-[var(--text-disabled)] mt-1">
                        Real-time facility monitoring and production queue management.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/production/batches" className="h-10 px-4 flex items-center gap-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-all">
                        {t.viewAll}
                    </Link>
                    <Link href="/production/batches" className="h-10 px-5 flex items-center gap-2 rounded-xl text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-all shadow-lg shadow-[var(--primary)]/20">
                        <Factory className="w-4 h-4" />
                        {t.viewAddBatches}
                        <ArrowRight className={cn("w-4 h-4 ml-2", isRTL && "rotate-180 mr-2 ml-0")} />
                    </Link>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card
                        key={i}
                        className="p-6 border-[var(--border)] bg-[var(--card)] rounded-2xl hover:border-[var(--primary)]/40 transition-all border-b-4 border-b-transparent hover:border-b-[var(--primary)] shadow-sm"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{stat.title}</p>
                                <h3 className={cn("text-2xl font-black tracking-tight", stat.color)}>
                                    {stat.value}
                                </h3>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] tracking-tight opacity-70">
                                    {stat.sub}
                                </p>
                            </div>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", stat.bg, stat.border)}>
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Production Queue Feed */}
            <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-8 border-b border-[var(--border)]/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">{t.currentProductionQueue}</h2>
                        <p className="text-[11px] text-[var(--text-disabled)] mt-0.5">Live monitoring of floor activity and batch progression.</p>
                    </div>
                    <LayoutGrid className="w-6 h-6 text-[var(--text-disabled)] opacity-20" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]/30">
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.batchNo}</th>
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.product}</th>
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-left" : "text-right")}>{t.targetQty}</th>
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.status}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]/20">
                            {batches.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Activity className="w-10 h-10 text-[var(--text-disabled)] opacity-20" />
                                            <p className="text-sm font-bold text-[var(--text-disabled)] italic">{t.noActiveProduction}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                batches.slice(0, 10).map((batch) => (
                                    <tr key={batch.id} className="group hover:bg-[var(--muted)]/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center border border-[var(--border)] group-hover:border-[var(--primary)]/30 transition-all font-mono text-[10px] font-black uppercase">
                                                    {batch.batchNumber.slice(-2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{batch.batchNumber}</p>
                                                    <p className="text-[10px] font-bold text-[var(--text-disabled)] flex items-center gap-1 uppercase tracking-tighter">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(batch.startDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-[var(--text-primary)]">
                                                    {batch.product?.name}
                                                </span>
                                                {batch.product?.size && (
                                                    <span className="text-[9px] text-[var(--text-disabled)] font-black uppercase tracking-widest">
                                                        {batch.product.size} {batch.product.unit || 'gm'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6" style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                            <span className="text-sm font-black tracking-tight text-[var(--text-primary)]">
                                                {Number(batch.targetQty).toLocaleString()} kg
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={cn(
                                                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-center inline-block min-w-[100px] border shadow-sm",
                                                batch.status === 'completed' ? 'bg-emerald-500 text-white border-emerald-400/20' :
                                                    batch.status === 'in_progress' ? 'bg-blue-500 text-white border-blue-400/20' :
                                                        batch.status === 'quality_check' ? 'bg-amber-500 text-white border-amber-400/20' :
                                                            batch.status === 'failed' ? 'bg-red-500 text-white border-red-400/20' :
                                                                'bg-zinc-500 text-white border-zinc-400/20'
                                            )}>
                                                {t[batch.status as keyof typeof t] || batch.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {batches.length > 0 && (
                    <div className="p-6 bg-[var(--muted)]/10 border-t border-[var(--border)]/30 text-center">
                        <Link href="/production/batches" className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline">
                            {t.viewAll}
                            {isRTL ? <ChevronLeft className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
}

function ChevronLeft({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-chevron-left", className)}><path d="m15 18-6-6 6-6" /></svg>
    )
}
