import { getSalesOverview } from '@/app/actions/sales/overview';
import SalesOverviewClient from './SalesOverviewClient';

export default async function SalesPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const data = await getSalesOverview(businessSlug);

  return (
    <SalesOverviewClient data={data} businessSlug={businessSlug} />
  );
}
