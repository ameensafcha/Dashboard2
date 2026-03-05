import { getCrmOverview } from '@/app/actions/crm/overview';
import CrmOverviewClient from './CrmOverviewClient';


export default async function CRMPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const data = await getCrmOverview();
  return <CrmOverviewClient data={data} businessSlug={businessSlug} />;
}
