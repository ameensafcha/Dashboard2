import { getDashboardLowStockAlerts } from '@/app/actions/dashboard';
import LowStockAlerts from './LowStockAlerts';

export default async function LowStockAlertsSection() {
    const data = await getDashboardLowStockAlerts();
    return <LowStockAlerts data={data} />;
}
