import { PageHeader } from '@/components/ui/PageHeader';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function TasksPage() {
  return (
    <PermissionGuard module="tasks" action="view">
      <div className="p-4 sm:p-6">
        <PageHeader title="Team & Tasks" />
        <p style={{ color: 'var(--text-muted)' }}>Tasks module coming soon...</p>
      </div>
    </PermissionGuard>
  );
}
