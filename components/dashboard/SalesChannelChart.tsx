'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const CHANNEL_COLORS = ['#E8A838', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#6b7280'];

type ChannelData = { name: string; value: number }[];

export default function SalesChannelChart({ data }: { data: ChannelData }) {
    const { t, isRTL } = useTranslation();

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
    );
}
