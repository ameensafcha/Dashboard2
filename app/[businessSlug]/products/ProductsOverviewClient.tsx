'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/lib/i18n';
import { Coffee, Layers, CheckCircle, Activity, ArrowRight, LayoutGrid, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProductsOverviewData {
    totalProducts: number;
    totalCategories: number;
    activeCount: number;
    sfdaApprovedCount: number;
    statusBreakdown: { status: string; count: number }[];
    sfdaBreakdown: { status: string; count: number }[];
    recentProducts: any[];
}

export default function ProductsOverviewClient({ data }: { data: ProductsOverviewData }) {
    const { t, isRTL } = useTranslation();

    const stats = [
        {
            title: t.totalProducts,
            value: data.totalProducts,
            icon: <Coffee className="w-5 h-5 text-[var(--primary)]" />,
            color: "text-[var(--primary)]",
            bg: "bg-[var(--primary)]/5",
            border: "border-[var(--primary)]/10"
        },
        {
            title: t.categories,
            value: data.totalCategories,
            icon: <Layers className="w-5 h-5 text-blue-400" />,
            color: "text-blue-400",
            bg: "bg-blue-400/5",
            border: "border-blue-400/10"
        },
        {
            title: t.sfdaApproved,
            value: data.sfdaApprovedCount,
            icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
            color: "text-emerald-400",
            bg: "bg-emerald-400/5",
            border: "border-emerald-400/10"
        },
        {
            title: t.activeProducts || 'Active Products',
            value: data.activeCount,
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
                        {t.productsOverview}
                    </h1>
                    <p className="text-sm text-[var(--text-disabled)] mt-1">
                        Centralized catalog management and compliance monitoring.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/products/catalog" className="h-10 px-4 flex items-center gap-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-all">
                        {t.productCatalog}
                    </Link>
                    <Link href="/products/pricing" className="h-10 px-4 flex items-center gap-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-all">
                        {t.pricing}
                    </Link>
                    <Link href="/products/catalog" className="h-10 px-5 flex items-center gap-2 rounded-xl text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-all">
                        {t.addNewProduct}
                        <ArrowRight className="w-4 h-4 ml-2" />
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
                                    {stat.value.toLocaleString()}
                                </h3>
                            </div>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", stat.bg, stat.border)}>
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Side Analytics */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-8 border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-sm">
                        <div className="mb-8">
                            <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">{t.catalogSummary || 'Catalog Status'}</h2>
                            <p className="text-[10px] text-[var(--text-disabled)] mt-0.5 uppercase tracking-tighter">Production lifecycle.</p>
                        </div>
                        <div className="space-y-6">
                            {data.statusBreakdown.map((item) => (
                                <div key={item.status} className="space-y-2">
                                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-[var(--text-secondary)]">{t[item.status as keyof typeof t] || item.status}</span>
                                        <span className="text-[var(--primary)]">{item.count}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[var(--muted)]/50 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000",
                                                item.status === 'active' ? 'bg-emerald-500' : item.status === 'in_development' ? 'bg-amber-500' : 'bg-red-500'
                                            )}
                                            style={{ width: `${(item.count / (data.totalProducts || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-8 border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-sm">
                        <div className="mb-8">
                            <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">{t.sfdaCompliance || 'Compliance'}</h2>
                            <p className="text-[10px] text-[var(--text-disabled)] mt-0.5 uppercase tracking-tighter">Certification status.</p>
                        </div>
                        <div className="space-y-6">
                            {data.sfdaBreakdown.map((item) => (
                                <div key={item.status} className="space-y-2">
                                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-[var(--text-secondary)]">{t[item.status as keyof typeof t] || item.status}</span>
                                        <span className="text-[var(--text-primary)] font-black">{item.count}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[var(--muted)]/50 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000",
                                                item.status === 'approved' ? 'bg-blue-500' : 'bg-zinc-500'
                                            )}
                                            style={{ width: `${(item.count / (data.totalProducts || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Recent Products */}
                <Card className="lg:col-span-8 border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-[var(--border)]/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">{t.recentTransactions || 'Latest Additions'}</h2>
                            <p className="text-[11px] text-[var(--text-disabled)] mt-0.5">Most recently added products.</p>
                        </div>
                        <LayoutGrid className="w-6 h-6 text-[var(--text-disabled)] opacity-20" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border)]/30">
                                    <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.productName}</th>
                                    <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.category}</th>
                                    <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-left" : "text-right")}>{t.price}</th>
                                    <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.status}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]/20">
                                {data.recentProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <p className="text-sm font-bold text-[var(--text-disabled)] italic">No products found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.recentProducts.map((p) => (
                                        <tr key={p.id} className="group hover:bg-[var(--muted)]/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center border border-[var(--border)] group-hover:border-[var(--primary)]/30 transition-all">
                                                        <Coffee className="w-5 h-5 text-[var(--text-disabled)] opacity-40 group-hover:opacity-100 group-hover:text-[var(--primary)] transition-all" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{p.name}</p>
                                                        <p className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-tighter">{p.skuPrefix}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[11px] font-bold text-[var(--text-secondary)] bg-[var(--muted)]/50 px-2 py-1 rounded-md">
                                                    {p.category?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6" style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                                <span className="text-sm font-black tracking-tight text-[var(--text-primary)]">
                                                    SAR {p.baseRetailPrice.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight text-center inline-block min-w-[80px] border border-current",
                                                    p.status === 'active' ? "bg-emerald-500/10 text-emerald-500" :
                                                        p.status === 'in_development' ? "bg-amber-500/10 text-amber-500" :
                                                            "bg-red-500/10 text-red-500"
                                                )}>
                                                    {t[p.status as keyof typeof t] || p.status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-[var(--muted)]/10 border-t border-[var(--border)]/30 text-center">
                        <Link href="/products/catalog" className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline">
                            {t.viewFullHistory || 'Manage Catalog'}
                            {isRTL ? <ChevronLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
