import { getDashboardActivityFeed } from '@/app/actions/dashboard';
import ActivityFeed from './ActivityFeed';

export default async function ActivityFeedSection({ businessSlug }: { businessSlug?: string }) {
    const data = await getDashboardActivityFeed(businessSlug);
    return <ActivityFeed data={data} />;
}
