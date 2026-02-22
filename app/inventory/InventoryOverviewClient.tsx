'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    Package, AlertTriangle, Clock, DollarSign, ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type InventoryOverviewData = {
    kpis: {
        totalValue: number;
        rawMaterialsCount: number;
        finishedProductsCount: number;
        lowStockCount: number;
        expiringCount: number;
    };
    lowStockItems: { name: string; sku: string; type: string; currentStock: number; threshold: number }[];
    expiringItems: { name: string; sku: string; type: string; expiryDate: string }[];
    recentMovements: { movementId: string; type: string; quantity: number; reason: string; itemName: string; time: string }[];
    stockBreakdown: { name: string; sku: string; type: string; stock: number; value: number }[];
};

function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function InventoryOverviewClient({ data }: { data: InventoryOverviewData }) {
    const kpis = [
        { title: 'Total Inventory Value', value: data.kpis.totalValue, prefix: 'SAR ', icon: DollarSign, color: '#E8A838' },
        { title: 'Raw Materials', value: data.kpis.rawMaterialsCount, icon: Package, color: '#3b82f6' },
        { title: 'Finished Products', value: data.kpis.finishedProductsCount, icon: Package, color: '#22c55e' },
        { title: 'Low Stock Alerts', value: data.kpis.lowStockCount, icon: AlertTriangle, color: data.kpis.lowStockCount > 0 ? '#ef4444' : '#22c55e' },
    ];

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <PageHeader title="Inventory Overview" />
                <div className="flex gap-2">
                    <Link href="/inventory/raw-materials" className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:border-[var(--primary)]" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Raw Materials</Link>
                    <Link href="/inventory/finished" className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:border-[var(--primary)]" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Finished Products</Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.title} className="rounded-xl p-5 border transition-all hover:shadow-md" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{kpi.title}</span>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                                    <Icon className="w-4.5 h-4.5" style={{ color: kpi.color }} />
                                </div>
                            </div>
                            <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                                {kpi.prefix || ''}{typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-US', { minimumFractionDigits: kpi.prefix ? 2 : 0, maximumFractionDigits: 2 }) : kpi.value}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Stock Breakdown Table — shows WHAT is in stock */}
            <div className="rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Package className="w-4 h-4" style={{ color: '#E8A838' }} /> All Stock — Konsa Product Kitna Hai
                    </h2>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{data.stockBreakdown.length} items</span>
                </div>
                {data.stockBreakdown.length === 0 ? (
                    <div className="py-6 text-center" style={{ color: 'var(--text-muted)' }}>No stock items yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Item</th>
                                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-secondary)' }}>SKU</th>
                                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Type</th>
                                    <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Stock</th>
                                    <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.stockBreakdown.map(item => (
                                    <tr key={item.sku} className="hover:bg-[var(--background)]/50" style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td className="py-2.5 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</td>
                                        <td className="py-2.5 px-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{item.sku}</td>
                                        <td className="py-2.5 px-3">
                                            <Badge className={item.type === 'Raw Material' ? 'bg-blue-500 text-white text-[10px]' : 'bg-green-500 text-white text-[10px]'}>{item.type}</Badge>
                                        </td>
                                        <td className={`py-2.5 px-3 text-right font-semibold ${item.stock <= 0 ? 'text-red-500' : ''}`} style={item.stock > 0 ? { color: 'var(--text-primary)' } : {}}>
                                            {item.stock}
                                        </td>
                                        <td className="py-2.5 px-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                                            SAR {item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Low Stock + Expiring */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Low Stock */}
                <div className="rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <AlertTriangle className="w-4 h-4 text-red-500" /> Low Stock Items
                        </h2>
                        <Badge className="bg-red-500 text-white">{data.lowStockItems.length}</Badge>
                    </div>
                    {data.lowStockItems.length === 0 ? (
                        <div className="py-6 text-center" style={{ color: 'var(--text-muted)' }}>All stock levels healthy ✅</div>
                    ) : (
                        <div className="space-y-0 max-h-[250px] overflow-y-auto">
                            {data.lowStockItems.map((item, i) => (
                                <div key={item.sku} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < data.lowStockItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div>
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                                        <span className="text-xs ml-2 font-mono" style={{ color: 'var(--text-muted)' }}>{item.sku}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-red-500">{item.currentStock}</span>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {item.threshold} min</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Expiring Soon */}
                <div className="rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Clock className="w-4 h-4 text-amber-500" /> Expiring Soon (30 days)
                        </h2>
                        <Badge className={data.kpis.expiringCount > 0 ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}>{data.kpis.expiringCount}</Badge>
                    </div>
                    {data.expiringItems.length === 0 ? (
                        <div className="py-6 text-center" style={{ color: 'var(--text-muted)' }}>No items expiring soon ✅</div>
                    ) : (
                        <div className="space-y-0 max-h-[250px] overflow-y-auto">
                            {data.expiringItems.map((item, i) => {
                                const days = daysUntil(item.expiryDate);
                                const isUrgent = days <= 7;
                                return (
                                    <div key={item.sku} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < data.expiringItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                        <div>
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                                            <span className="text-xs ml-2 font-mono" style={{ color: 'var(--text-muted)' }}>{item.sku}</span>
                                        </div>
                                        <Badge className={isUrgent ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}>
                                            {days <= 0 ? 'EXPIRED' : `${days}d left`}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Movements */}
            <div className="rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Stock Movements</h2>
                {data.recentMovements.length === 0 ? (
                    <div className="py-6 text-center" style={{ color: 'var(--text-muted)' }}>No movements logged yet</div>
                ) : (
                    <div className="space-y-0 max-h-[280px] overflow-y-auto">
                        {data.recentMovements.map((m, i) => (
                            <div key={m.movementId} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < data.recentMovements.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{m.type === 'STOCK_IN' ? '📥' : '📤'}</span>
                                    <div>
                                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{m.itemName}</span>
                                        <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{m.reason.replace(/_/g, ' ')}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-medium ${m.type === 'STOCK_IN' ? 'text-green-500' : 'text-red-500'}`}>
                                        {m.type === 'STOCK_IN' ? '+' : '-'}{m.quantity}
                                    </span>
                                    <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>{m.movementId}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
