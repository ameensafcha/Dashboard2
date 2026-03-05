import { Skeleton } from '@/components/ui/skeleton';

interface TableLoaderProps {
    rows?: number;
    cols?: number;
}

export default function TableLoader({ rows = 5, cols = 4 }: TableLoaderProps) {
    return (
        <>
            {[...Array(rows)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-[var(--border)]/30">
                    {[...Array(cols)].map((_, j) => (
                        <td key={`cell-${i}-${j}`} className="px-6 py-4">
                            <Skeleton
                                className="h-4 opacity-15 rounded-md"
                                style={{ width: j === 0 ? '60%' : j === cols - 1 ? '30%' : '45%' }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
