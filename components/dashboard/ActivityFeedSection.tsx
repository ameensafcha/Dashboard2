import { getDashboardActivityFeed } from '@/app/actions/dashboard';
import ActivityFeed from './ActivityFeed';

export default async function ActivityFeedSection() {
    const data = await getDashboardActivityFeed();
    return <ActivityFeed data={data} />;
}
