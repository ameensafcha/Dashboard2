'use client';

import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type TrendData = { month: string; revenue: number; expenses: number }[];

export default function RevenueTrendChart({ data }: { data: TrendData }) {
    const { t, isRTL } = useTranslation();

    return (
        <div className="rounded-2xl p-6 border shadow-sm h-full" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className={cn("flex items-center justify-between mb-6", isRTL ? "flex-row-reverse" : "flex-row")}>
                <h2 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-primary)' }}>{t.revenueVsExpenses}</h2>
                <div className={cn("flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-50", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("flex items-center gap-1.5", isRTL ? "flex-row-reverse" : "flex-row")}><div className="w-2 h-2 rounded-full bg-[#22c55e]" /> {t.txn_revenue}</div>
                    <div className={cn("flex items-center gap-1.5", isRTL ? "flex-row-reverse" : "flex-row")}><div className="w-2 h-2 rounded-full bg-[#ef4444]" /> {t.txn_expense}</div>
                </div>
            </div>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data}>
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
    );
}
