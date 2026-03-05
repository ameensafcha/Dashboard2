'use client';

import { useCallback, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getDashboardSalesByChannel } from '@/app/actions/dashboard';

const CHANNEL_COLORS = ['#E8A838', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#6b7280'];

type ChannelData = { name: string; value: number }[];

export default function SalesChannelChart({ data: initialData }: { data: ChannelData }) {
    const { t, isRTL } = useTranslation();
    const params = useParams();
    const businessSlug = params?.businessSlug as string;

    const { data: qData } = useQuery({
        queryKey: ['dashboard-sales-channel', businessSlug],
        queryFn: () => getDashboardSalesByChannel(businessSlug),
        initialData,
        staleTime: 10_000,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });
    const data = (qData || initialData) ?? [];

    const tooltipFormatter = useCallback((value: any) =>
        `SAR ${Number(value).toLocaleString()}`,
        []);

    const legendFormatter = useCallback((value: any) => (
        <span className={cn("text-[10px] font-black uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>
            {t[`chan_${value}` as keyof typeof t] || value}
        </span>
    ), [t, isRTL]);

    const tooltipStyle = useMemo(() => ({ textAlign: isRTL ? 'right' : 'left' } as const), [isRTL]);

    return (
        <div className="rounded-2xl p-6 border shadow-sm h-full" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h2 className={cn("text-sm font-black uppercase tracking-[0.2em] mb-6", isRTL ? "text-right" : "text-left")} style={{ color: 'var(--text-primary)' }}>{t.salesByChannelMTD}</h2>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, i) => (
                                <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            formatter={legendFormatter}
                        />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[260px] flex items-center justify-center opacity-40">
                    <p className="text-xs font-bold">No orders this month yet.</p>
                </div>
            )}
        </div>
    );
}
