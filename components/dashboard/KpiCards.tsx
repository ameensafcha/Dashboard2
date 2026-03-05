'use client';

import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown, Receipt, BarChart3 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getDashboardKpis } from '@/app/actions/dashboard';

type KpiData = {
    revenue: { value: number; change: number };
    expenses: { value: number; change: number };
    netProfit: { value: number; change: number };
    orders: { value: number; change: number };
    activeClients: { value: number; change: number };
    inventoryValue: { value: number; change: number };
    rawInventoryValue: { value: number; change: number };
    finishedInventoryCost: { value: number; change: number };
    finishedInventoryRetail: { value: number; change: number };
} | null;

export default function KpiCards({ data: initialData }: { data: KpiData }) {
    const { t, isRTL } = useTranslation();
    const params = useParams();
    const businessSlug = params?.businessSlug as string;

    const { data: qData } = useQuery({
        queryKey: ['dashboard-kpi', businessSlug],
        queryFn: () => getDashboardKpis(businessSlug),
        initialData,
        staleTime: 10_000,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });

    const data = qData || initialData;

    if (!data) return null;

    const cards = [
        { title: t.revenueMTD, value: data.revenue.value, change: data.revenue.change, icon: DollarSign, prefix: 'SAR ', color: '#22c55e' },
        { title: t.expensesMTD, value: data.expenses.value, change: data.expenses.change, icon: Receipt, prefix: 'SAR ', color: '#ef4444' },
        { title: t.netProfitMTD, value: data.netProfit.value, change: data.netProfit.change, icon: BarChart3, prefix: 'SAR ', color: data.netProfit.value >= 0 ? '#22c55e' : '#ef4444' },
        { title: t.ordersMTD, value: data.orders.value, change: data.orders.change, icon: ShoppingCart, color: '#3b82f6' },
        { title: 'Raw Inventory', value: data.rawInventoryValue.value, change: 0, icon: Package, prefix: 'SAR ', color: '#3b82f6' },
        { title: 'Finished (Cost)', value: data.finishedInventoryCost.value, change: 0, icon: Package, prefix: 'SAR ', color: '#22c55e' },
        { title: 'Finished (Retail)', value: data.finishedInventoryRetail.value, change: 0, icon: DollarSign, prefix: 'SAR ', color: '#E8A838' },
        { title: t.activeClients, value: data.activeClients.value, change: data.activeClients.change, icon: Users, color: '#a855f7' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((kpi) => {
                const Icon = kpi.icon;
                const isUp = kpi.change >= 0;
                return (
                    <div
                        key={kpi.title}
                        className={cn("rounded-xl p-5 border transition-all hover:shadow-md", isRTL ? "text-right" : "text-left")}
                        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                    >
                        <div className={cn("flex items-center justify-between mb-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                            <span className="text-sm font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-secondary)' }}>{kpi.title}</span>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-inner" style={{ background: `${kpi.color}15` }}>
                                <Icon className="w-4.5 h-4.5" style={{ color: kpi.color }} />
                            </div>
                        </div>
                        <div className={cn("flex items-end justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
                            <span className="text-2xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
                                {kpi.prefix || ''}{typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-US', { minimumFractionDigits: kpi.prefix ? 2 : 0, maximumFractionDigits: 2 }) : kpi.value}
                            </span>
                            {kpi.change !== 0 && (
                                <div className={cn("flex items-center text-[10px] font-black uppercase tracking-widest", isRTL ? "flex-row-reverse" : "flex-row")} style={{ color: isUp ? '#22c55e' : '#ef4444' }}>
                                    {isUp ? <TrendingUp className={cn("w-3.5 h-3.5", isRTL ? "ml-1" : "mr-1")} /> : <TrendingDown className={cn("w-3.5 h-3.5", isRTL ? "ml-1" : "mr-1")} />}
                                    {isUp ? '+' : ''}{kpi.change}%
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
