import { Metadata } from 'next';
import { getProductionBatches, getQualityChecks, getSystemSettings } from '@/app/actions/production';
import ProductionDashboardClient from './ProductionDashboardClient';

export const metadata: Metadata = {
  title: 'Production | Safcha Dashboard',
  description: 'Production overview and KPIs',
};

export const dynamic = 'force-dynamic';

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
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && b.status !== 'planned' && b.status !== 'failed';
  });

  const monthlyProductionKg = thisMonthBatches.reduce((sum, b) => sum + (Number(b.actualQty) || Number(b.targetQty) || 0), 0);
  const settings = await getSystemSettings();
  const MAX_CAPACITY_KG = settings.productionCapacityKg; // Expected monthly scale
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
  const activeTrend: 'up' | 'down' | 'neutral' = activeDiff > 0 ? 'up' : activeDiff < 0 ? 'down' : 'neutral';

  // Average Yield (Completed batches only)
  // Derive an average facility performance per-batch to prevent one massively heavy batch from skewing overall yields
  const completedBatches = batches.filter(b => b.status === 'completed' && b.yieldPercent !== null);

  const avgYield = completedBatches.length > 0
    ? (completedBatches.reduce((sum, b) => sum + Number(b.yieldPercent), 0) / completedBatches.length).toFixed(1)
    : '0.0';

  // QC Pass Rate
  const recentQC = qualityChecks.slice(0, 30); // Last 30 checks
  const passedQC = recentQC.filter(qc => qc.passed).length;
  const qcPassRate = recentQC.length > 0 ? Math.round((passedQC / recentQC.length) * 100) : 0;

  return (
    <ProductionDashboardClient
      batches={batches}
      activeBatches={activeBatches}
      utilizationPercent={utilizationPercent}
      monthlyProductionKg={monthlyProductionKg}
      maxCapacityKg={MAX_CAPACITY_KG}
      activeTrendText={activeTrendText}
      activeTrend={activeTrend}
    />
  );
}
