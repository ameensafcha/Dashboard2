import { PageHeader } from '@/components/ui/PageHeader';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function DocumentsPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Documents" />
      <PermissionGuard module="documents" action="view">
        <p style={{ color: 'var(--text-muted)' }}>Documents vault coming soon...</p>
      </PermissionGuard>
    </div>
  );
}
