import { getCrmOverview } from '@/app/actions/crm/overview';
import CrmOverviewClient from './CrmOverviewClient';

export default async function CRMPage() {
  const data = await getCrmOverview();
  return <CrmOverviewClient data={data} />;
}
