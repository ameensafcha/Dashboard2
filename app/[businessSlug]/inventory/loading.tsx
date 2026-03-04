import { Skeleton } from "@/components/ui/skeleton";

export default function ModuleLoading() {
    return (
        <div className="p-4 sm:p-6 lg:p-10 space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48 opacity-20" />
                    <Skeleton className="h-4 w-64 opacity-10" />
                </div>
                <Skeleton className="h-12 w-40 rounded-2xl opacity-20" />
            </div>

            {/* Grid/Table Placeholder */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
                <div className="p-6 border-b border-[var(--border)] bg-[var(--muted)]/20 flex flex-col sm:flex-row gap-4 justify-between">
                    <Skeleton className="h-11 w-full sm:max-w-md rounded-xl opacity-20" />
                    <div className="flex gap-3">
                        <Skeleton className="h-11 w-32 rounded-xl opacity-20" />
                        <Skeleton className="h-11 w-32 rounded-xl opacity-20" />
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-xl opacity-20" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-40 opacity-20" />
                                    <Skeleton className="h-3 w-24 opacity-10" />
                                </div>
                            </div>
                            <div className="flex gap-8">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16 opacity-10" />
                                    <Skeleton className="h-4 w-20 opacity-20" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16 opacity-10" />
                                    <Skeleton className="h-4 w-20 opacity-20" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
