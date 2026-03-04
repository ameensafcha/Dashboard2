import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="rounded-xl p-5 border border-[var(--border)] bg-[var(--card)] h-32 space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24 opacity-20" />
                            <Skeleton className="h-9 w-9 rounded-lg opacity-20" />
                        </div>
                        <div className="flex items-end justify-between">
                            <Skeleton className="h-8 w-32 opacity-20" />
                            <Skeleton className="h-4 w-12 opacity-20" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3 rounded-2xl p-6 border border-[var(--border)] bg-[var(--card)] h-[360px] space-y-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-48 opacity-20" />
                        <div className="flex gap-4">
                            <Skeleton className="h-3 w-16 opacity-20" />
                            <Skeleton className="h-3 w-16 opacity-20" />
                        </div>
                    </div>
                    <Skeleton className="h-[240px] w-full opacity-10" />
                </div>
                <div className="lg:col-span-2 rounded-2xl p-6 border border-[var(--border)] bg-[var(--card)] h-[360px] space-y-6">
                    <Skeleton className="h-4 w-40 opacity-20" />
                    <div className="flex items-center justify-center h-[240px]">
                        <Skeleton className="h-48 w-48 rounded-full opacity-10" />
                    </div>
                </div>
            </div>

            {/* Bottom Row Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rounded-2xl p-6 border border-[var(--border)] bg-[var(--card)] h-[440px] space-y-6">
                    <Skeleton className="h-3 w-32 opacity-20" />
                    <div className="grid grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/5 flex flex-col items-center justify-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-2xl opacity-20" />
                                <Skeleton className="h-3 w-16 opacity-20" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 rounded-2xl p-6 border border-[var(--border)] bg-[var(--card)] h-[440px] space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-xl opacity-20" />
                            <Skeleton className="h-5 w-40 opacity-20" />
                        </div>
                        <Skeleton className="h-3 w-20 opacity-20" />
                    </div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-4 border-b border-[var(--border)] last:border-0 px-4">
                                <Skeleton className="h-6 w-1 rounded-full opacity-20" />
                                <Skeleton className="h-4 flex-1 opacity-20" />
                                <Skeleton className="h-3 w-16 opacity-20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
