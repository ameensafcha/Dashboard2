import { getTeamMembers, getRoles, getAllBusinessesWithRoles } from '@/app/actions/adminActions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import { AddTeamMemberForm } from './AddTeamMemberForm';
import { EditUserBusinessAccess } from './EditUserBusinessAccess';


export default async function TeamPage({ params }: { params: Promise<{ businessSlug: string }> }) {
    const { businessSlug } = await params;
    const members = await getTeamMembers();
    const roles = await getRoles();
    const allBusinesses = await getAllBusinessesWithRoles();

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        const initials = parts.map(n => n[0]).filter(Boolean).join('');
        return (initials || name[0] || 'U').substring(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your team members and their roles.
                    </p>
                </div>
                <AddTeamMemberForm roles={roles.map(r => ({ id: r.id, name: r.name, isSystem: r.isSystem }))} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Members ({members.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(member.name || member.email)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.name || 'Unknown User'}</p>
                                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={member.role?.isSystem ? 'default' : 'secondary'}>
                                                {member.role?.name || 'No Role'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={member.isActive ? 'outline' : 'destructive'} className={member.isActive ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                                                {member.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <EditUserBusinessAccess
                                                user={{ id: member.userId, name: member.name, email: member.email }}
                                                allBusinesses={allBusinesses}
                                            />
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
