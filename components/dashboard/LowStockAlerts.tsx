'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getDashboardLowStockAlerts } from '@/app/actions/dashboard';

type LowStockItem = { name: string; sku: string; type: 'Raw Material' | 'Finished'; currentStock: number; threshold: number };

export default function LowStockAlerts({ data: initialData }: { data: LowStockItem[] }) {
    const { t, isRTL } = useTranslation();
    const params = useParams();
    const businessSlug = params?.businessSlug as string;

    const { data: qData } = useQuery({
        queryKey: ['dashboard-low-stock', businessSlug],
        queryFn: () => getDashboardLowStockAlerts(businessSlug),
        initialData,
        staleTime: 10_000,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });
    const data = qData || initialData;

    if (data.length === 0) return null;

    return (
        <div className="rounded-2xl p-6 border border-red-500/20 shadow-lg shadow-red-500/5" style={{ background: 'var(--card)' }}>
            <div className={cn("flex items-center justify-between mb-6", isRTL ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-primary)' }}>
                        {t.lowStockAlerts}
                    </h2>
                </div>
                <Link href={`/${businessSlug}/inventory`} className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity", isRTL ? "flex-row-reverse" : "flex-row")} style={{ color: '#ef4444' }}>
                    {t.viewInventory} <ArrowRight className={cn("w-3.5 h-3.5", isRTL ? "rotate-180" : "")} />
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map(item => (
                    <div key={item.sku} className={cn("group flex items-center justify-between p-4 rounded-xl border transition-all hover:border-red-500/40", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")} style={{ borderColor: 'var(--border)', background: 'var(--muted)/10' }}>
                        <div className="space-y-1">
                            <span className="text-sm font-black tracking-tight block" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                            <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                                <Badge className={cn("text-[9px] font-black uppercase tracking-tighter px-2 py-0 border-0", item.type === 'Raw Material' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white')}>
                                    {item.type === 'Raw Material' ? t.rawMaterialLabel : t.finishedLabel}
                                </Badge>
                                <span className="text-[10px] font-mono opacity-50" style={{ color: 'var(--text-muted)' }}>{item.sku}</span>
                            </div>
                        </div>
                        <div className={isRTL ? "text-left" : "text-right"}>
                            <div className="text-xl font-black text-red-500 leading-none">{item.currentStock}</div>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 uppercase" style={{ color: 'var(--text-muted)' }}>{t.minLabel}: {item.threshold}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
