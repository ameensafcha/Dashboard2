import { getDashboardSalesByChannel } from '@/app/actions/dashboard';
import SalesChannelChart from './SalesChannelChart';

export default async function SalesChannelSection() {
    const data = await getDashboardSalesByChannel();
    return <SalesChannelChart data={data} />;
}
