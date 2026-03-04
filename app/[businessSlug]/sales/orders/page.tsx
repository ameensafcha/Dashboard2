import OrdersClient from './OrdersClient';

export const metadata = {
  title: 'Orders | Safcha',
};

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  return <OrdersClient />;
}
