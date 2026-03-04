import { getDashboardKpis } from '@/app/actions/dashboard';
import KpiCards from './KpiCards';

export default async function KpiSection() {
    const data = await getDashboardKpis();
    return <KpiCards data={data} />;
}
