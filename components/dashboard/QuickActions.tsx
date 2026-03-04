'use client';

import Link from 'next/link';
import { ShoppingCart, Package, Users, DollarSign } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function QuickActions() {
    const { t, isRTL } = useTranslation();
    const { can } = usePermissions();
    const params = useParams();
    const businessSlug = params?.businessSlug as string;

    const rawQuickActions = [
        { label: t.newOrder, href: `/${businessSlug}/sales/orders/new`, icon: ShoppingCart, module: 'orders', action: 'create' },
        { label: t.addStock, href: `/${businessSlug}/inventory/raw-materials`, icon: Package, module: 'inventory', action: 'create' },
        { label: t.addClient, href: `/${businessSlug}/crm/contacts`, icon: Users, module: 'crm', action: 'create' },
        { label: t.addExpense, href: `/${businessSlug}/finance/expenses`, icon: DollarSign, module: 'finance', action: 'create' },
    ];

    const quickActions = rawQuickActions.filter(action => can(action.module, action.action));

    return (
        <div className="rounded-2xl p-6 border shadow-sm h-full" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
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
    );
}
