import OrdersClient from './OrdersClient';
import { getOrders } from '@/app/actions/sales/orders';

export const metadata = {
  title: 'Orders | Safcha',
};


export default async function OrdersPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const result = await getOrders(businessSlug);
  const initialOrders = result.success && 'orders' in result ? result.orders : [];

  return <OrdersClient initialOrders={(initialOrders || []) as any} businessSlug={businessSlug} />;
}
