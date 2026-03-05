'use client';

import { useCallback } from 'react';
import { Activity, Clock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getDashboardActivityFeed } from '@/app/actions/dashboard';

const feedColors: Record<string, string> = {
    order: '#22c55e',
    stock: '#E8A838',
    production: '#3b82f6',
};

type ActivityItem = { type: 'order' | 'stock' | 'production', time: string, data: any };

export default function ActivityFeed({ data: initialData }: { data: ActivityItem[] }) {
    const { t, isRTL } = useTranslation();
    const params = useParams();
    const businessSlug = params?.businessSlug as string;

    const { data: qData } = useQuery({
        queryKey: ['dashboard-activity-feed', businessSlug],
        queryFn: () => getDashboardActivityFeed(businessSlug),
        initialData,
        staleTime: 10_000,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });
    const data = (qData || initialData) ?? [];

    const formatFeedItem = useCallback((item: ActivityItem) => {
        const { type, data } = item;
        if (type === 'order') {
            const status = t[data.status as keyof typeof t] || data.status;
            return `${t.order} ${data.number} — ${status} (SAR ${data.amount.toLocaleString()})`;
        }
        if (type === 'stock') {
            const icon = data.type === 'STOCK_IN' ? '📥' : '📤';
            const reason = t[data.type?.toLowerCase() as keyof typeof t] || data.type?.replace('_', ' ') || 'Unknown';
            return `${icon} ${data.id}: ${reason} — ${data.qty} kg`;
        }
        if (type === 'production') {
            const status = t[data.status as keyof typeof t] || data.status?.replace('_', ' ') || 'Unknown';
            return `🏭 ${data.number} — ${status}`;
        }
        return '';
    }, [t]);

    const timeAgo = useCallback((dateStr: string) => {
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
    }, [t]);

    return (
        <div className="rounded-2xl p-6 border shadow-sm h-full" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className={cn("flex items-center justify-between mb-6", isRTL ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-primary)' }}>
                        {t.liveActivity}
                    </h2>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{data.length} {t.dashboard_events}</span>
            </div>
            {data.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center opacity-40">
                    <Clock className="w-8 h-8" />
                    <p className="text-xs font-bold max-w-[200px] leading-relaxed">{t.noRecentActivity}</p>
                </div>
            ) : (
                <div className="space-y-0 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                    {data.map((item, i) => (
                        <div
                            key={`${item.type}-${item.time}-${i}`}
                            className={cn("flex items-start gap-4 py-4 group transition-colors hover:bg-[var(--muted)]/20 px-4 -mx-4 rounded-xl", isRTL ? "flex-row-reverse" : "flex-row")}
                            style={{ borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none' }}
                        >
                            <div
                                className="w-1.5 h-6 rounded-full mt-1 flex-shrink-0"
                                style={{ background: feedColors[item.type] || 'var(--text-muted)' }}
                            />
                            <span className={cn("text-xs font-bold flex-1 leading-relaxed", isRTL ? "text-right" : "text-left")} style={{ color: 'var(--foreground)' }}>{formatFeedItem(item)}</span>
                            <span suppressHydrationWarning className="text-[10px] font-black uppercase tracking-widest opacity-30 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>{timeAgo(item.time)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
