import { PageHeader } from '@/components/ui/PageHeader';
import { getDashboardData } from '@/app/actions/dashboard';
import DashboardClient from './DashboardClient';

export default async function Home() {
  const data = await getDashboardData();

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="CEO Dashboard" />
      <DashboardClient data={data} />
    </div>
  );
}
