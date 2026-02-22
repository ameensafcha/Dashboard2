'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    DollarSign, ShoppingCart, TrendingUp, TrendingDown, Clock, ArrowRight,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CHANNEL_COLORS = ['#E8A838', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#6b7280'];

const statusColors: Record<string, string> = {
    draft: 'bg-gray-500', confirmed: 'bg-blue-500', processing: 'bg-amber-500',
    shipped: 'bg-purple-500', delivered: 'bg-green-500', cancelled: 'bg-red-500',
};

type SalesOverviewData = {
    kpis: {
        revenue: { value: number; change: number };
        orders: { value: number; change: number };
        avgOrderValue: { value: number; change: number };
        pendingOrders: { value: number; change: number };
    };
    recentOrders: { id: string; orderNumber: string; status: string; channel: string; grandTotal: number; date: Date; client: { name: string } }[];
    salesByChannel: { name: string; value: number }[];
};

export default function SalesOverviewClient({ data }: { data: SalesOverviewData }) {
    const kpis = [
        { title: 'Revenue (MTD)', value: data.kpis.revenue.value, change: data.kpis.revenue.change, icon: DollarSign, prefix: 'SAR ', color: '#22c55e' },
        { title: 'Orders (MTD)', value: data.kpis.orders.value, change: data.kpis.orders.change, icon: ShoppingCart, color: '#3b82f6' },
        { title: 'Avg Order Value', value: data.kpis.avgOrderValue.value, change: 0, icon: TrendingUp, prefix: 'SAR ', color: '#E8A838' },
        { title: 'Pending Orders', value: data.kpis.pendingOrders.value, change: 0, icon: Clock, color: '#a855f7' },
    ];

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <PageHeader title="Sales Overview" />
                <Link href="/sales/orders/new" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>
                    + New Order
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(kpi => {
                    const Icon = kpi.icon;
                    const isUp = kpi.change >= 0;
                    return (
                        <div key={kpi.title} className="rounded-xl p-5 border transition-all hover:shadow-md" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{kpi.title}</span>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                                    <Icon className="w-4.5 h-4.5" style={{ color: kpi.color }} />
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                                    {kpi.prefix || ''}{typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-US', { minimumFractionDigits: kpi.prefix ? 2 : 0, maximumFractionDigits: 2 }) : kpi.value}
                                </span>
                                {kpi.change !== 0 && (
                                    <div className="flex items-center text-xs font-medium" style={{ color: isUp ? '#22c55e' : '#ef4444' }}>
                                        {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                                        {isUp ? '+' : ''}{kpi.change}%
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Channel Chart + Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Channel Chart */}
                <div className="rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Sales by Channel</h2>
                    {data.salesByChannel.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={data.salesByChannel} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                    {data.salesByChannel.map((_, i) => <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: any) => `SAR ${Number(value).toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No orders this month</div>
                    )}
                </div>

                {/* Recent Orders */}
                <div className="lg:col-span-2 rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Orders</h2>
                        <Link href="/sales/orders" className="text-xs flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {data.recentOrders.length === 0 ? (
                        <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>No orders yet</div>
                    ) : (
                        <div className="space-y-0 max-h-[240px] overflow-y-auto">
                            {data.recentOrders.map((o, i) => (
                                <div key={o.id} className="flex items-center justify-between py-2.5 gap-4" style={{ borderBottom: i < data.recentOrders.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{o.orderNumber}</span>
                                        <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{o.client.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] text-white ${statusColors[o.status] || 'bg-gray-500'}`}>
                                            {o.status}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                                        SAR {o.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
