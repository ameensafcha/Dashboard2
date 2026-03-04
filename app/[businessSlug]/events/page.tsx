import { PageHeader } from '@/components/ui/PageHeader';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function EventsPage() {
  return (
    <PermissionGuard module="events" action="view">
      <div className="p-4 sm:p-6">
        <PageHeader title="Events & Expos" />
        <p style={{ color: 'var(--text-muted)' }}>Events module coming soon...</p>
      </div>
    </PermissionGuard>
  );
}
