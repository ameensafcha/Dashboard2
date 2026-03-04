import { Skeleton } from "@/components/ui/skeleton";

export default function CRMLoading() {
    return (
        <div className="p-4 sm:p-6 lg:p-10 space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <Skeleton className="h-10 w-48 opacity-20" />
                <Skeleton className="h-12 w-40 rounded-2xl opacity-20" />
            </div>

            {/* Table Container Skeleton */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
                {/* Search Bar Skeleton */}
                <div className="p-6 border-b border-[var(--border)] bg-[var(--muted)]/20 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 w-full flex-1">
                        <Skeleton className="h-11 w-full sm:max-w-md rounded-xl opacity-20" />
                        <Skeleton className="h-11 w-full sm:w-[240px] rounded-xl opacity-20" />
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                            <tr>
                                {[...Array(5)].map((_, i) => (
                                    <th key={i} className="px-8 py-4">
                                        <Skeleton className="h-3 w-20 opacity-20" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]/50">
                            {[...Array(6)].map((_, i) => (
                                <tr key={i} className="border-b border-[var(--border)]/30">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-11 h-11 rounded-full opacity-20" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32 opacity-20" />
                                                <Skeleton className="h-3 w-40 opacity-20" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-28 opacity-20" />
                                            <Skeleton className="h-3 w-20 opacity-20" />
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <Skeleton className="h-5 w-16 rounded-full opacity-20" />
                                    </td>
                                    <td className="px-8 py-5">
                                        <Skeleton className="h-8 w-24 rounded-xl opacity-20" />
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-end">
                                            <Skeleton className="h-6 w-8 rounded-lg opacity-20" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
