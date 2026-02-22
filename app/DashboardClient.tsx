'use client';

import Link from 'next/link';
import { useAppStore } from '@/stores/appStore';
import {
    DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown,
    ArrowRight, Receipt, BarChart3, Activity, AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

const CHANNEL_COLORS = ['#E8A838', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#6b7280'];

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

const feedColors: Record<string, string> = {
    order: '#22c55e',
    stock: '#E8A838',
    production: '#3b82f6',
};

type DashboardData = {
    kpis: {
        revenue: { value: number; change: number };
        expenses: { value: number; change: number };
        netProfit: { value: number; change: number };
        orders: { value: number; change: number };
        inventoryValue: { value: number; change: number };
        activeClients: { value: number; change: number };
    };
    revenueTrend: { month: string; revenue: number; expenses: number }[];
    salesByChannel: { name: string; value: number }[];
    activityFeed: { text: string; time: string; type: string }[];
    lowStockAlerts: { name: string; sku: string; type: string; currentStock: number; threshold: number }[];
};

export default function DashboardClient({ data }: { data: DashboardData }) {
    const { isRTL } = useAppStore();

    const kpiCards = [
        { title: 'Revenue (MTD)', value: data.kpis.revenue.value, change: data.kpis.revenue.change, icon: DollarSign, prefix: 'SAR ', color: '#22c55e' },
        { title: 'Expenses (MTD)', value: data.kpis.expenses.value, change: data.kpis.expenses.change, icon: Receipt, prefix: 'SAR ', color: '#ef4444' },
        { title: 'Net Profit (MTD)', value: data.kpis.netProfit.value, change: data.kpis.netProfit.change, icon: BarChart3, prefix: 'SAR ', color: data.kpis.netProfit.value >= 0 ? '#22c55e' : '#ef4444' },
        { title: 'Orders (MTD)', value: data.kpis.orders.value, change: data.kpis.orders.change, icon: ShoppingCart, color: '#3b82f6' },
        { title: 'Inventory Value', value: data.kpis.inventoryValue.value, change: data.kpis.inventoryValue.change, icon: Package, prefix: 'SAR ', color: '#E8A838' },
        { title: 'Active Clients', value: data.kpis.activeClients.value, change: data.kpis.activeClients.change, icon: Users, color: '#a855f7' },
    ];

    const quickActions = [
        { label: 'New Order', href: '/sales/orders/new', icon: ShoppingCart },
        { label: 'Add Stock', href: '/inventory/raw-materials', icon: Package },
        { label: 'Add Client', href: '/crm/contacts', icon: Users },
        { label: 'Add Expense', href: '/finance/expenses', icon: DollarSign },
    ];

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpiCards.map((kpi) => {
                    const Icon = kpi.icon;
                    const isUp = kpi.change >= 0;
                    return (
                        <div
                            key={kpi.title}
                            className="rounded-xl p-5 border transition-all hover:shadow-md"
                            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                        >
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

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Revenue Trend */}
                <div className="lg:col-span-3 rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Revenue vs Expenses (6 months)</h2>
                    {data.revenueTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={data.revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                                    labelStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} name="Revenue" />
                                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Expenses" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                            No transaction data yet. Revenue appears when orders are delivered.
                        </div>
                    )}
                </div>

                {/* Sales by Channel */}
                <div className="lg:col-span-2 rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Sales by Channel (MTD)</h2>
                    {data.salesByChannel.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={data.salesByChannel}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                    {data.salesByChannel.map((_, i) => (
                                        <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `SAR ${Number(value).toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                            No orders this month yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock Alerts */}
            {data.lowStockAlerts.length > 0 && (
                <div className="rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <AlertTriangle className="w-4 h-4 text-red-500" /> Low Stock Alerts
                        </h2>
                        <Link href="/inventory" className="text-xs flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                            View Inventory <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.lowStockAlerts.map(item => (
                            <div key={item.sku} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'rgba(239,68,68,0.05)' }}>
                                <div>
                                    <span className="text-sm font-medium block" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge className={item.type === 'Raw Material' ? 'bg-blue-500 text-white text-[10px] px-1.5 py-0' : 'bg-green-500 text-white text-[10px] px-1.5 py-0'}>{item.type}</Badge>
                                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{item.sku}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-red-500">{item.currentStock}</span>
                                    <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>min: {item.threshold}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions + Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Quick Actions */}
                <div className="rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {quickActions.map(a => (
                            <Link
                                key={a.href}
                                href={a.href}
                                className="flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:border-[var(--primary)] hover:shadow-sm group"
                                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                            >
                                <a.icon className="w-5 h-5 mb-2 group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-secondary)' }} />
                                <span className="text-xs font-medium group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>{a.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-2 rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                            <Activity className="w-4 h-4 inline mr-2" style={{ color: 'var(--primary)' }} />
                            Live Activity
                        </h2>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{data.activityFeed.length} events</span>
                    </div>
                    {data.activityFeed.length === 0 ? (
                        <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                            No recent activity. Create orders, log stock, or start batches.
                        </div>
                    ) : (
                        <div className="space-y-0 max-h-[320px] overflow-y-auto pr-1">
                            {data.activityFeed.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 py-2.5"
                                    style={{ borderBottom: i < data.activityFeed.length - 1 ? '1px solid var(--border)' : 'none' }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                        style={{ background: feedColors[item.type] || 'var(--text-muted)' }}
                                    />
                                    <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{item.text}</span>
                                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(item.time)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
