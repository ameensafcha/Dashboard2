'use client';

import Link from 'next/link';
import {
    DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown,
    ArrowRight, Receipt, BarChart3, Activity, AlertTriangle, Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

const CHANNEL_COLORS = ['#E8A838', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#6b7280'];

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
    activityFeed: { type: 'order' | 'stock' | 'production', time: string, data: any }[];
    lowStockAlerts: { name: string; sku: string; type: 'Raw Material' | 'Finished'; currentStock: number; threshold: number }[];
};

export default function DashboardClient({ data }: { data: DashboardData }) {
    const { t, isRTL } = useTranslation();

    function formatFeedItem(item: DashboardData['activityFeed'][0]) {
        const { type, data } = item;
        if (type === 'order') {
            const status = t[data.status as keyof typeof t] || data.status;
            return `${t.order} ${data.number} — ${status} (SAR ${data.amount.toLocaleString()})`;
        }
        if (type === 'stock') {
            const icon = data.type === 'STOCK_IN' ? '📥' : '📤';
            const reason = t[data.type.toLowerCase() as keyof typeof t] || data.type.replace('_', ' ');
            return `${icon} ${data.id}: ${reason} — ${data.qty} kg`;
        }
        if (type === 'production') {
            const status = t[data.status as keyof typeof t] || data.status.replace('_', ' ');
            return `🏭 ${data.number} — ${status}`;
        }
        return '';
    }

    function timeAgo(dateStr: string) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t.justNow;
        if (mins < 60) return `${mins}${t.minAgo}`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}${t.hoursAgo}`;
        const days = Math.floor(hours / 24);
        return `${days}${t.daysAgo}`;
    }

    const kpiCards = [
        { title: t.revenueMTD, value: data.kpis.revenue.value, change: data.kpis.revenue.change, icon: DollarSign, prefix: 'SAR ', color: '#22c55e' },
        { title: t.expensesMTD, value: data.kpis.expenses.value, change: data.kpis.expenses.change, icon: Receipt, prefix: 'SAR ', color: '#ef4444' },
        { title: t.netProfitMTD, value: data.kpis.netProfit.value, change: data.kpis.netProfit.change, icon: BarChart3, prefix: 'SAR ', color: data.kpis.netProfit.value >= 0 ? '#22c55e' : '#ef4444' },
        { title: t.ordersMTD, value: data.kpis.orders.value, change: data.kpis.orders.change, icon: ShoppingCart, color: '#3b82f6' },
        { title: t.inventoryTotalValue, value: data.kpis.inventoryValue.value, change: data.kpis.inventoryValue.change, icon: Package, prefix: 'SAR ', color: '#E8A838' },
        { title: t.activeClients, value: data.kpis.activeClients.value, change: data.kpis.activeClients.change, icon: Users, color: '#a855f7' },
    ];

    const quickActions = [
        { label: t.newOrder, href: '/sales/orders/new', icon: ShoppingCart },
        { label: t.addStock, href: '/inventory/raw-materials', icon: Package },
        { label: t.addClient, href: '/crm/contacts', icon: Users },
        { label: t.addExpense, href: '/finance/expenses', icon: DollarSign },
    ];

    return (
        <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpiCards.map((kpi) => {
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

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Revenue Trend */}
                <div className="lg:col-span-3 rounded-2xl p-6 border shadow-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className={cn("flex items-center justify-between mb-6", isRTL ? "flex-row-reverse" : "flex-row")}>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-primary)' }}>{t.revenueVsExpenses}</h2>
                        <div className={cn("flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-50", isRTL ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn("flex items-center gap-1.5", isRTL ? "flex-row-reverse" : "flex-row")}><div className="w-2 h-2 rounded-full bg-[#22c55e]" /> {t.txn_revenue}</div>
                            <div className={cn("flex items-center gap-1.5", isRTL ? "flex-row-reverse" : "flex-row")}><div className="w-2 h-2 rounded-full bg-[#ef4444]" /> {t.txn_expense}</div>
                        </div>
                    </div>
                    {data.revenueTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={data.revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} orientation={isRTL ? "top" : "bottom"} reversed={isRTL} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} orientation={isRTL ? "right" : "left"} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}
                                    labelStyle={{ color: 'var(--text-primary)', marginBottom: '4px' }}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} name={t.txn_revenue} />
                                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 4, strokeWidth: 0 }} name={t.txn_expense} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[260px] flex flex-col items-center justify-center gap-3 opacity-40">
                            <Activity className="w-8 h-8" />
                            <p className="text-xs font-bold">{t.txn_noTransactions}</p>
                        </div>
                    )}
                </div>

                {/* Sales by Channel */}
                <div className="lg:col-span-2 rounded-2xl p-6 border shadow-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className={cn("text-sm font-black uppercase tracking-[0.2em] mb-6", isRTL ? "text-right" : "text-left")} style={{ color: 'var(--text-primary)' }}>{t.salesByChannelMTD}</h2>
                    {data.salesByChannel.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={data.salesByChannel}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.salesByChannel.map((entry, i) => (
                                        <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `SAR ${Number(value).toLocaleString()}`} contentStyle={{ textAlign: isRTL ? 'right' : 'left' }} />
                                <Legend
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="circle"
                                    formatter={(value: any) => (
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>
                                            {t[`chan_${value}` as keyof typeof t] || value}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center opacity-40">
                            <p className="text-xs font-bold">No orders this month yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock Alerts */}
            {data.lowStockAlerts.length > 0 && (
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
                        <Link href="/inventory" className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity", isRTL ? "flex-row-reverse" : "flex-row")} style={{ color: '#ef4444' }}>
                            {t.viewInventory} <ArrowRight className={cn("w-3.5 h-3.5", isRTL ? "rotate-180" : "")} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.lowStockAlerts.map(item => (
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
            )}

            {/* Quick Actions + Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="rounded-2xl p-6 border shadow-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className={cn("text-xs font-black uppercase tracking-[0.3em] mb-6 opacity-40", isRTL ? "text-right" : "text-left")} style={{ color: 'var(--text-primary)' }}>{t.quickActions}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {quickActions.map(a => (
                            <Link
                                key={a.href}
                                href={a.href}
                                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all hover:border-[var(--primary)] hover:shadow-xl hover:-translate-y-1 group"
                                style={{ borderColor: 'var(--border)', background: 'var(--muted)/5' }}
                            >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--card)] border border-[var(--border)] group-hover:bg-[var(--primary)]/10 group-hover:border-[var(--primary)]/20 transition-colors">
                                    <a.icon className="w-5 h-5 group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-secondary)' }} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>{a.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-2 rounded-2xl p-6 border shadow-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className={cn("flex items-center justify-between mb-6", isRTL ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-primary)' }}>
                                {t.liveActivity}
                            </h2>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{data.activityFeed.length} {t.dashboard_events}</span>
                    </div>
                    {data.activityFeed.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center opacity-40">
                            <Clock className="w-8 h-8" />
                            <p className="text-xs font-bold max-w-[200px] leading-relaxed">{t.noRecentActivity}</p>
                        </div>
                    ) : (
                        <div className="space-y-0 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                            {data.activityFeed.map((item, i) => (
                                <div
                                    key={i}
                                    className={cn("flex items-start gap-4 py-4 group transition-colors hover:bg-[var(--muted)]/20 px-4 -mx-4 rounded-xl", isRTL ? "flex-row-reverse" : "flex-row")}
                                    style={{ borderBottom: i < data.activityFeed.length - 1 ? '1px solid var(--border)' : 'none' }}
                                >
                                    <div
                                        className="w-1.5 h-6 rounded-full mt-1 flex-shrink-0"
                                        style={{ background: feedColors[item.type] || 'var(--text-muted)' }}
                                    />
                                    <span className={cn("text-xs font-bold flex-1 leading-relaxed", isRTL ? "text-right" : "text-left")} style={{ color: 'var(--foreground)' }}>{formatFeedItem(item)}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>{timeAgo(item.time)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
