import { getTasks } from '@/app/actions/tasks/tasks';
import TasksBoardClient from './TasksBoardClient';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default async function TasksPage({ params, searchParams }: { params: Promise<{ businessSlug: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { businessSlug } = await params;

  const resolvedSearchParams = await searchParams;
  const assigneeId = typeof resolvedSearchParams.assigneeId === 'string' ? resolvedSearchParams.assigneeId : undefined;
  const status = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined;

  const tasks = await getTasks(businessSlug, assigneeId, status);

  return (
    <PermissionGuard module="crm" action="view">
      <TasksBoardClient initialTasks={tasks} businessSlug={businessSlug} />
    </PermissionGuard>
  );
}
