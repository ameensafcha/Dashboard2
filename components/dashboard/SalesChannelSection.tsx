import { getDashboardSalesByChannel } from '@/app/actions/dashboard';
import SalesChannelChart from './SalesChannelChart';

export default async function SalesChannelSection({ businessSlug }: { businessSlug?: string }) {
    const data = await getDashboardSalesByChannel(businessSlug);
    return <SalesChannelChart data={data} />;
}
