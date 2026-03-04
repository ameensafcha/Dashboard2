import { redirect } from 'next/navigation';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';

export default async function TasksLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ businessSlug: string }>;
}) {
    const { businessSlug } = await params;
    const ctx = await getBusinessContext(businessSlug);

    if (!hasPermission(ctx, 'tasks', 'view')) {
        redirect(`/${businessSlug}`);
    }

    return <>{children}</>;
}

export const dynamic = 'force-dynamic';
