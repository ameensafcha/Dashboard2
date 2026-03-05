// components/ui/skeletons.tsx

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="space-y-3">
            {/* Header row */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: cols }).map((_, j) => (
                    <div key={j} className="h-9 rounded-md animate-pulse" style={{ background: 'var(--muted)' }} />
                ))}
            </div>
            {/* Data rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <div key={j} className="h-8 rounded-md animate-pulse" style={{ background: 'var(--muted)', opacity: 1 - i * 0.1 }} />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function KPICardSkeleton() {
    return (
        <div className="p-4 rounded-xl border animate-pulse" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="h-3 w-20 rounded mb-3" style={{ background: 'var(--muted)' }} />
            <div className="h-8 w-28 rounded mb-2" style={{ background: 'var(--muted)' }} />
            <div className="h-3 w-16 rounded" style={{ background: 'var(--muted)' }} />
        </div>
    );
}

export function PageHeaderSkeleton() {
    return (
        <div className="flex items-center justify-between mb-6 animate-pulse">
            <div>
                <div className="h-7 w-40 rounded mb-2" style={{ background: 'var(--muted)' }} />
                <div className="h-4 w-24 rounded" style={{ background: 'var(--muted)' }} />
            </div>
            <div className="h-10 w-32 rounded-lg" style={{ background: 'var(--muted)' }} />
        </div>
    );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="p-4 rounded-xl border animate-pulse" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="h-4 rounded mb-3 last:mb-0" style={{ background: 'var(--muted)', width: `${100 - i * 15}%` }} />
            ))}
        </div>
    );
}
