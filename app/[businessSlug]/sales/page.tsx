import { getSalesOverview } from '@/app/actions/sales/overview';
import SalesOverviewClient from './SalesOverviewClient';

export default async function SalesPage() {
  const data = await getSalesOverview();
  return <SalesOverviewClient data={data} />;
}
