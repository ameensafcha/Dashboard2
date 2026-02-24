import { getCrmOverview } from '@/app/actions/crm/overview';
import CrmOverviewClient from './CrmOverviewClient';

export const dynamic = 'force-dynamic';

export default async function CRMPage() {
  const data = await getCrmOverview();
  return <CrmOverviewClient data={data} />;
}
