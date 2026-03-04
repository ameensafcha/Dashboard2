import { getAuditLogs } from '@/app/actions/adminActions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage({
    params,
    searchParams
}: {
    params: Promise<{ businessSlug: string }>;
    searchParams: Promise<{ page?: string }>;
}) {
    const { businessSlug } = await params;
    const sParams = await searchParams;
    const page = Number(sParams?.page) || 1;
    const { logs, total, pages } = await getAuditLogs(page, 50);

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
        if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
        if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
        if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground mt-2">
                    System-wide trail of actions performed by team members.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity ({total} Total Records)</CardTitle>
                    <CardDescription>Showing latest 50 logs. Use pagination to browse history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <ScrollArea className="h-[600px]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Module</TableHead>
                                        <TableHead>Entity</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                                            </TableCell>
                                            <TableCell>
                                                {log.userName ? log.userName : 'System'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getActionColor(log.action)}>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{log.module || '-'}</TableCell>
                                            <TableCell>
                                                {log.entityName || log.entity} {log.entityId && `(${log.entityId})`}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={JSON.stringify(log.details)}>
                                                    {JSON.stringify(log.details)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {logs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No audit logs found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>

                    {pages > 1 && (
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Page {page} of {pages}
                            </div>
                            {/* Pagination controls would go here (e.g., Link href="?page=2") */}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
