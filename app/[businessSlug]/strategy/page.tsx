import { getGoalsOverview, getGoals } from '@/app/actions/strategy/goals';
import StrategyOverviewClient from './StrategyOverviewClient';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default async function StrategyPage({ params, searchParams }: { params: Promise<{ businessSlug: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { businessSlug } = await params;

  const resolvedSearchParams = await searchParams;
  const type = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type : undefined;
  const status = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined;

  const [overview, goals] = await Promise.all([
    getGoalsOverview(businessSlug),
    getGoals(businessSlug, type, status)
  ]);

  return (
    <PermissionGuard module="crm" action="view">
      <StrategyOverviewClient initialOverview={overview} initialGoals={goals} businessSlug={businessSlug} />
    </PermissionGuard>
  );
}
