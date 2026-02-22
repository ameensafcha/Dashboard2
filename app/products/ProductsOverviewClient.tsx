'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/lib/i18n';
import { Coffee, Layers, CheckCircle, Activity, ArrowRight, LayoutGrid, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProductsOverviewData {
    totalProducts: number;
    totalCategories: number;
    activeCount: number;
    sfdaApprovedCount: number;
    statusBreakdown: { status: string; count: number }[];
    sfdaBreakdown: { status: string; count: number }[];
}

export default function ProductsOverviewClient({ data }: { data: ProductsOverviewData }) {
    const { t, isRTL } = useTranslation();

    const stats = [
        {
            title: t.totalProducts,
            value: data.totalProducts,
            icon: Coffee,
            color: 'var(--primary)',
            bg: 'rgba(232, 168, 56, 0.08)'
        },
        {
            title: t.categories,
            value: data.totalCategories,
            icon: Layers,
            color: '#3b82f6',
            bg: 'rgba(59, 130, 246, 0.08)'
        },
        {
            title: t.sfdaApproved,
            value: data.sfdaApprovedCount,
            icon: CheckCircle,
            color: '#10b981',
            bg: 'rgba(16, 185, 129, 0.08)'
        },
        {
            title: t.activeProducts,
            value: data.activeCount,
            icon: Activity,
            color: 'var(--primary)',
            bg: 'rgba(232, 168, 56, 0.08)'
        }
    ];

    const quickActions = [
        { title: t.productCatalog, href: '/products/catalog', icon: LayoutGrid, desc: 'Manage catalog & SKUs' },
        { title: t.categories, href: '/products/categories', icon: Layers, desc: 'Organize product types' },
        { title: t.pricing, href: '/products/pricing', icon: DollarSign, desc: 'Set margins & tiers' },
        { title: t.suppliers, href: '/products/suppliers', icon: Users, desc: 'Manage raw material sources' },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-10 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <PageHeader title={t.productsOverview} />

            {/* 1. Primary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="p-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                    >
                        {/* Background Icon - More subtle and smaller to prevent override */}
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
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Distributions & Summary */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Status Distribution */}
                    <div className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)] shadow-sm space-y-8 relative overflow-hidden">
                        <div className={cn("flex justify-between items-center", isRTL ? "flex-row-reverse" : "")}>
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[var(--primary)]" />
                                {t.catalogSummary}
                            </h3>
                            <span className="text-[9px] bg-[var(--muted)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{t.distribution}</span>
                        </div>

                        <div className="space-y-6">
                            {data.statusBreakdown.map((item) => (
                                <div key={item.status} className="space-y-2">
                                    <div className={cn("flex justify-between text-[11px] font-bold uppercase tracking-wider", isRTL ? "flex-row-reverse text-right" : "")}>
                                        <span className="text-[var(--text-primary)]">{t[item.status as keyof typeof t] || item.status}</span>
                                        <span className="text-[var(--text-secondary)]">{item.count}</span>
                                    </div>
                                    <div className="h-2 w-full bg-[var(--muted)] rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-1000",
                                                item.status === 'active' ? 'bg-green-500' : item.status === 'in_development' ? 'bg-amber-500' : 'bg-red-500/80'
                                            )}
                                            style={{ width: `${(item.count / data.totalProducts) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SFDA Compliance Distribution */}
                    <div className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)] shadow-sm space-y-8 relative overflow-hidden">
                        <div className={cn("flex justify-between items-center", isRTL ? "flex-row-reverse" : "")}>
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                {t.sfdaCompliance}
                            </h3>
                            <span className="text-[9px] bg-[var(--muted)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{t.distribution}</span>
                        </div>

                        <div className="space-y-6">
                            {data.sfdaBreakdown.map((item) => (
                                <div key={item.status} className="space-y-2">
                                    <div className={cn("flex justify-between text-[11px] font-bold uppercase tracking-wider", isRTL ? "flex-row-reverse text-right" : "")}>
                                        <span className="text-[var(--text-primary)]">{t[item.status as keyof typeof t] || item.status}</span>
                                        <span className="text-[var(--text-secondary)]">{item.count}</span>
                                    </div>
                                    <div className="h-2 w-full bg-[var(--muted)] rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-1000",
                                                item.status === 'approved' ? 'bg-green-500' : item.status === 'pending' ? 'bg-amber-500' : 'bg-red-500/80'
                                            )}
                                            style={{ width: `${(item.count / data.totalProducts) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Quick Actions Sidebar */}
                <div className="space-y-6">
                    <div className="bg-[#121212] p-8 rounded-2xl border border-white/5 shadow-2xl space-y-8">
                        <h3 className={cn("text-[11px] font-black uppercase tracking-[0.3em] text-[var(--primary)] flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                            <LayoutGrid className="w-4 h-4" />
                            {t.quickActions}
                        </h3>

                        <div className="space-y-4">
                            {quickActions.map((action, idx) => (
                                <Link
                                    key={idx}
                                    href={action.href}
                                    className={cn(
                                        "flex items-center p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-[var(--primary)]/20 transition-all group group/link",
                                        isRTL ? "flex-row-reverse text-right" : ""
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl bg-[var(--primary)]/5 flex items-center justify-center mr-4 group-hover/link:bg-[var(--primary)]/10 transition-colors shrink-0", isRTL ? "mr-0 ml-4" : "")}>
                                        <action.icon className="w-5 h-5 text-[var(--primary)]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[13px] font-bold text-white group-hover/link:text-[var(--primary)] transition-colors">{action.title}</p>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{action.desc}</p>
                                    </div>
                                    {isRTL ? (
                                        <ArrowRight className="w-4 h-4 text-gray-700 rotate-180 group-hover/link:translate-x-[-4px] group-hover/link:text-[var(--primary)] transition-all" />
                                    ) : (
                                        <ArrowRight className="w-4 h-4 text-gray-700 group-hover/link:translate-x-1 group-hover/link:text-[var(--primary)] transition-all" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
