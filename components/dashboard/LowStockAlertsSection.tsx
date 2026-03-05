import { getDashboardLowStockAlerts } from '@/app/actions/dashboard';
import LowStockAlerts from './LowStockAlerts';

export default async function LowStockAlertsSection({ businessSlug }: { businessSlug?: string }) {
    const data = await getDashboardLowStockAlerts(businessSlug);
    return <LowStockAlerts data={data} />;
}
