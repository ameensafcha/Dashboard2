import { getInventoryOverview } from '@/app/actions/inventory/overview';
import InventoryOverviewClient from './InventoryOverviewClient';


export default async function InventoryPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const data = await getInventoryOverview();
  return <InventoryOverviewClient data={data} businessSlug={businessSlug} />;
}
