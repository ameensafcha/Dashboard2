import { getInventoryOverview } from '@/app/actions/inventory/overview';
import InventoryOverviewClient from './InventoryOverviewClient';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const data = await getInventoryOverview();
  return <InventoryOverviewClient data={data} />;
}
