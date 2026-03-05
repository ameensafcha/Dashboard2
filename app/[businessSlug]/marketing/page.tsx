import { getMarketingOverview, getCampaigns } from '@/app/actions/marketing/campaigns';
import MarketingOverviewClient from '@/app/[businessSlug]/marketing/MarketingOverviewClient';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default async function MarketingPage({ params, searchParams }: { params: Promise<{ businessSlug: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { businessSlug } = await params;

  const resolvedSearchParams = await searchParams;
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;
  const status = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined;
  const channel = typeof resolvedSearchParams.channel === 'string' ? resolvedSearchParams.channel : undefined;

  const data = await getMarketingOverview(businessSlug);
  const campaigns = await getCampaigns(businessSlug, search, status, channel);

  return (
    <PermissionGuard module="marketing" action="view">
      <MarketingOverviewClient data={data} initialCampaigns={campaigns} businessSlug={businessSlug} />
    </PermissionGuard>
  );
}
