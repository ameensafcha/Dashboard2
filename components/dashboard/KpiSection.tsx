import { getDashboardKpis } from '@/app/actions/dashboard';
import KpiCards from './KpiCards';

export default async function KpiSection({ businessSlug }: { businessSlug?: string }) {
    const data = await getDashboardKpis(businessSlug);
    return <KpiCards data={data} />;
}
