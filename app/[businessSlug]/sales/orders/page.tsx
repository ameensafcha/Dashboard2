import OrdersClient from './OrdersClient';
import { getOrders } from '@/app/actions/sales/orders';

export const metadata = {
  title: 'Orders | Safcha',
};


export default async function OrdersPage() {
  const result = await getOrders();
  const initialOrders = result.success && 'orders' in result ? result.orders : [];

  return <OrdersClient initialOrders={(initialOrders || []) as any} />;
}
