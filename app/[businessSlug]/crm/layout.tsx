import { redirect } from 'next/navigation';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';

export default async function CrmLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ businessSlug: string }>;
}) {
    const { businessSlug } = await params;
    const ctx = await getBusinessContext(businessSlug);

    if (!hasPermission(ctx, 'crm', 'view')) {
        redirect(`/${businessSlug}`);
    }

    return <>{children}</>;
}

