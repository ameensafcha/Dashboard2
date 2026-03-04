import { PageHeader } from '@/components/ui/PageHeader';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function MarketingPage() {
  return (
    <PermissionGuard module="marketing" action="view">
      <div className="p-4 sm:p-6">
        <PageHeader title="Marketing" />
        <p style={{ color: 'var(--text-muted)' }}>Marketing module coming soon...</p>
      </div>
    </PermissionGuard>
  );
}
