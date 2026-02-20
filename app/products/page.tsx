import { PageHeader } from '@/components/ui/PageHeader';

export default function ProductsOverview() {
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="Products Overview" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-lg border shadow-sm flex flex-col items-center justify-center text-center col-span-full py-12" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>Products Dashboard</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Overview metrics and KPI widgets will be added here in a future phase.</p>
                </div>
            </div>
        </div>
    );
}
