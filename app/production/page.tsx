import { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { getProductionBatches, getQualityChecks } from '@/app/actions/production';
import { LayoutDashboard, Factory, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Production | Safcha Dashboard',
  description: 'Production overview and KPIs',
};

export default async function ProductionPage() {
  const batches = await getProductionBatches();
  const qualityChecks = await getQualityChecks();

  // Calculate KPIs
  const activeBatches = batches.filter(b => b.status === 'in_progress').length;
  const pendingQC = batches.filter(b => b.status === 'quality_check').length;

  // Capacity Utilization (Max 3,000 kg)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthBatches = batches.filter(b => {
    const d = new Date(b.startDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && b.status !== 'planned';
  });

  const monthlyProductionKg = thisMonthBatches.reduce((sum, b) => sum + (b.actualQty || Number(b.targetQty) || 0), 0);
  const MAX_CAPACITY_KG = 3000;
  const utilizationPercent = Math.round((monthlyProductionKg / MAX_CAPACITY_KG) * 100);

  // Active Batches Trend (This week vs Last week)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const thisWeekActive = activeBatches; // Currently active
  const lastWeekActive = batches.filter(b => {
    const d = new Date(b.startDate);
    return d <= oneWeekAgo && (!b.endDate || new Date(b.endDate) > oneWeekAgo);
  }).length;

  const activeDiff = thisWeekActive - lastWeekActive;
  const activeTrendText = activeDiff > 0 ? `+${activeDiff} vs last wk` : activeDiff < 0 ? `${activeDiff} vs last wk` : 'Same as last wk';
  const activeTrend = activeDiff > 0 ? 'up' : activeDiff < 0 ? 'down' : 'neutral';

  // Average Yield (Completed batches only)
  const completedBatches = batches.filter(b => b.status === 'completed' && b.actualQty !== null && Number(b.targetQty) > 0);

  // Calculate weighted average (Total Actual / Total Target) for an accurate facility yield rating
  const totalActual = completedBatches.reduce((sum, b) => sum + Number(b.actualQty || 0), 0);
  const totalTarget = completedBatches.reduce((sum, b) => sum + Number(b.targetQty || 0), 0);

  const avgYield = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : '0.0';

  // QC Pass Rate
  const recentQC = qualityChecks.slice(0, 30); // Last 30 checks
  const passedQC = recentQC.filter(qc => qc.passed).length;
  const qcPassRate = recentQC.length > 0 ? Math.round((passedQC / recentQC.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Production Overview" />
        <Link href="/production/batches" className="bg-[#E8A838] text-black hover:bg-[#d69628] px-4 py-2 rounded-md font-medium text-sm transition-colors decoration-transparent text-center">
          View & Add Batches
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Batches"
          value={activeBatches.toString()}
          change={activeTrendText}
          trend={activeTrend}
          icon={Factory}
        />
        <KPICard
          title="Pending QC"
          value={pendingQC.toString()}
          change={pendingQC > 5 ? "High Queue" : pendingQC > 0 ? "Normal Load" : "All Clear"}
          trend={pendingQC > 5 ? "down" : pendingQC > 0 ? "neutral" : "up"}
          icon={AlertTriangle}
        />
        <KPICard
          title="Capacity Utilization"
          value={`${utilizationPercent}%`}
          change={`${monthlyProductionKg} kg / 3 tons`}
          trend={utilizationPercent > 90 ? "up" : "neutral"}
          icon={TrendingUp}
        />
        <KPICard
          title="Avg. Yield & QC"
          value={`${avgYield}%`}
          change={`${qcPassRate}% Pass Rate`}
          trend={qcPassRate >= 95 ? "up" : qcPassRate >= 80 ? "neutral" : "down"}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity / Production Queue */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Current Production Queue</h3>
            <Link href="/production/batches" className="text-sm text-[#E8A838] hover:underline font-medium decoration-transparent">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {batches.slice(0, 5).map((batch) => (
              <div key={batch.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{batch.batchNumber}</div>
                  <div className="text-sm text-gray-500">{batch.product?.name}</div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                    ${batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                      batch.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        batch.status === 'quality_check' ? 'bg-yellow-100 text-yellow-800' :
                          batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}`}
                  >
                    {batch.status.replace('_', ' ')}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">{Number(batch.targetQty)} kg</div>
                </div>
              </div>
            ))}
            {batches.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No active production batches found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
