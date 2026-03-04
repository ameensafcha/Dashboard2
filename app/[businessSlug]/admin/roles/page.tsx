import { getRoles } from '@/app/actions/adminActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Settings } from 'lucide-react';
import Link from 'next/link';
import { AddRoleForm } from './AddRoleForm';

export const dynamic = 'force-dynamic';

export default async function RolesPage({ params }: { params: Promise<{ businessSlug: string }> }) {
    const { businessSlug } = await params;
    const roles = await getRoles();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage roles and their access levels across the platform.
                    </p>
                </div>
                <AddRoleForm />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                    <Card key={role.id} className="relative hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2">
                                        {role.isSystem ? <Shield className="h-4 w-4 text-blue-500" /> : <Settings className="h-4 w-4 text-gray-500" />}
                                        {role.name}
                                    </CardTitle>
                                    <CardDescription>{role.description || 'No description provided.'}</CardDescription>
                                </div>
                                {role.isSystem && (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                                        System
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>{role._count?.users || 0} user{(role._count?.users || 0) !== 1 ? 's' : ''}</span>
                                </div>
                                <Link href={`/${businessSlug}/admin/roles/${role.id}`}>
                                    <Button variant="outline" size="sm">
                                        Manage Permissions
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
