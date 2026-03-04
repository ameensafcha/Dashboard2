import { redirect } from 'next/navigation';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';

export default async function AdminLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ businessSlug: string }>;
}) {
    const { businessSlug } = await params;

    // 1) Verify Business Context
    const ctx = await getBusinessContext(businessSlug);

    // 2) Enforce strict admin access via RBAC
    if (!hasPermission(ctx, 'admin', 'view')) {
        redirect(`/${businessSlug}`);
    }

    // 3) Optionally get user profile for the UI, though Sidebar/Header already do this
    return (
        <div className="flex flex-col h-full bg-gray-50/30">
            {/* The global sidebar & header are handled in app/layout.tsx already.
                This layout simply wraps all admin pages. */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <div className="container mx-auto px-6 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

// Ensure the page doesn't cache incorrectly across permission boundaries
