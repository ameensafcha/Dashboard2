import { getDashboardRevenueTrend } from '@/app/actions/dashboard';
import RevenueTrendChart from './RevenueTrendChart';

export default async function RevenueTrendSection({ businessSlug }: { businessSlug?: string }) {
    const data = await getDashboardRevenueTrend(businessSlug);
    return <RevenueTrendChart data={data} />;
}
