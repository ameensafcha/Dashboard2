import { PageHeader } from '@/components/ui/PageHeader';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function StrategyPage() {
  return (
    <PermissionGuard module="strategy" action="view">
      <div className="p-4 sm:p-6">
        <PageHeader title="Strategy" />
        <p style={{ color: 'var(--text-muted)' }}>Strategy module coming soon...</p>
      </div>
    </PermissionGuard>
  );
}
