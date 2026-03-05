import { Suspense } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';
import KpiSection from '@/components/dashboard/KpiSection';
import RevenueTrendSection from '@/components/dashboard/RevenueTrendSection';
import SalesChannelSection from '@/components/dashboard/SalesChannelSection';
import ActivityFeedSection from '@/components/dashboard/ActivityFeedSection';
import LowStockAlertsSection from '@/components/dashboard/LowStockAlertsSection';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardWrapper from '@/components/dashboard/DashboardWrapper';


function SectionSkeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted/20 rounded-2xl ${className}`} />;
}

import { getBusinessContext } from '@/lib/getBusinessContext';

export default async function BusinessHomePage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  let ctx;
  try {
    ctx = await getBusinessContext(businessSlug);
  } catch (e) {
    redirect('/login');
  }

  return (
    <div className="p-4 sm:p-6">
      <DashboardWrapper businessId={ctx?.businessId}>
        <Suspense fallback={<SectionSkeleton className="h-40 w-full" />}>
          <KpiSection businessSlug={businessSlug} />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <Suspense fallback={<SectionSkeleton className="h-[300px] w-full" />}>
              <RevenueTrendSection businessSlug={businessSlug} />
            </Suspense>
          </div>
          <div className="lg:col-span-2">
            <Suspense fallback={<SectionSkeleton className="h-[300px] w-full" />}>
              <SalesChannelSection businessSlug={businessSlug} />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={null}>
          <LowStockAlertsSection businessSlug={businessSlug} />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
          <div className="lg:col-span-2">
            <Suspense fallback={<SectionSkeleton className="h-[400px] w-full" />}>
              <ActivityFeedSection businessSlug={businessSlug} />
            </Suspense>
          </div>
        </div>
      </DashboardWrapper>
    </div>
  );
}

