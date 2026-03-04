import { getDashboardRevenueTrend } from '@/app/actions/dashboard';
import RevenueTrendChart from './RevenueTrendChart';

export default async function RevenueTrendSection() {
    const data = await getDashboardRevenueTrend();
    return <RevenueTrendChart data={data} />;
}
