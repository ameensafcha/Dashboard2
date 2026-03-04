import { getRoleWithPermissions } from '@/app/actions/adminActions';
import { RolePermissionsClient } from './RolePermissionsClient';
import { notFound } from 'next/navigation';


export default async function RolePermissionsPage({
    params
}: {
    params: Promise<{ businessSlug: string; id: string }>;
}) {
    const { id, businessSlug } = await params;
    const role = await getRoleWithPermissions(id);

    if (!role) {
        notFound();
    }

    return <RolePermissionsClient role={role as any} businessSlug={businessSlug} />;
}
