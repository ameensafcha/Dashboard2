'use server';

import prisma from '@/lib/prisma';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { serializeValues } from '@/lib/utils';
import { unstable_cache } from 'next/cache';

/**
 * KPI DATA (Revenue, Profit, Inventory Value, etc.)
 */
const getCachedKpis = (businessId: string) => unstable_cache(
    async () => {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [revMTD_res, revLast_res, expMTD_res, expLast_res, ordMTD_res, ordLast_res, clientRes, rawInvRes, products_for_cost] = await Promise.all([
            prisma.transaction.aggregate({ where: { type: 'revenue', date: { gte: firstOfMonth }, businessId }, _sum: { amount: true } }),
            prisma.transaction.aggregate({ where: { type: 'revenue', date: { gte: firstOfLastMonth, lt: firstOfMonth }, businessId }, _sum: { amount: true } }),
            prisma.transaction.aggregate({ where: { type: 'expense', date: { gte: firstOfMonth }, businessId }, _sum: { amount: true } }),
            prisma.transaction.aggregate({ where: { type: 'expense', date: { gte: firstOfLastMonth, lt: firstOfMonth }, businessId }, _sum: { amount: true } }),
            prisma.order.count({ where: { date: { gte: firstOfMonth }, businessId } }),
            prisma.order.count({ where: { date: { gte: firstOfLastMonth, lt: firstOfMonth }, businessId } }),
            prisma.client.count({ where: { deletedAt: null, businessId } }),
            prisma.$queryRaw<[{ total: number }]>`SELECT COALESCE(SUM(current_stock * unit_cost), 0)::float AS total FROM raw_materials WHERE business_id = ${businessId} AND deleted_at IS NULL`,
            prisma.finishedProduct.findMany({
                where: { businessId, product: { deletedAt: null } },
                select: { currentStock: true, unitCost: true, retailPrice: true }
            })
        ]);

        const revMTD = Number(revMTD_res._sum.amount || 0);
        const revLast = Number(revLast_res._sum.amount || 0);
        const expMTD = Number(expMTD_res._sum.amount || 0);
        const expLast = Number(expLast_res._sum.amount || 0);

        const finishedInventoryCost = products_for_cost.reduce((sum, p) => sum + (Number(p.currentStock) * Number(p.unitCost)), 0);
        const finishedInventoryRetail = products_for_cost.reduce((sum, p) => sum + (Number(p.currentStock) * Number(p.retailPrice)), 0);
        const rawInventoryValue = rawInvRes[0]?.total || 0;
        const totalInventoryValue = rawInventoryValue + finishedInventoryCost;

        const pctChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        return serializeValues({
            revenue: { value: revMTD, change: pctChange(revMTD, revLast) },
            expenses: { value: expMTD, change: pctChange(expMTD, expLast) },
            netProfit: { value: revMTD - expMTD, change: pctChange(revMTD - expMTD, revLast - expLast) },
            orders: { value: ordMTD_res, change: pctChange(ordMTD_res, ordLast_res) },
            inventoryValue: { value: Math.round(totalInventoryValue * 100) / 100, change: 0 },
            rawInventoryValue: { value: Math.round(Number(rawInventoryValue) * 100) / 100, change: 0 },
            finishedInventoryCost: { value: Math.round(Number(finishedInventoryCost) * 100) / 100, change: 0 },
            finishedInventoryRetail: { value: Math.round(Number(finishedInventoryRetail) * 100) / 100, change: 0 },
            activeClients: { value: clientRes, change: 0 },
        });
    },
    [`dashboard-kpis-${businessId}`],
    { tags: [`dashboard-kpi`, `dashboard-kpi-${businessId}`], revalidate: 3600 }
);

export async function revalidateDashboard() {
    try {
        const ctx = await getBusinessContext();
        const { revalidateTag } = await import('next/cache');
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-charts-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-feed-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-inventory-${ctx.businessId}`, { expire: 0 });
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function getDashboardKpis(businessSlug?: string) {
    try {
        const ctx = await getBusinessContext(businessSlug);
        if (!hasPermission(ctx, 'dashboard', 'view')) throw new Error('Unauthorized');
        return await getCachedKpis(ctx.businessId)();
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        return null;
    }
}

/**
 * REVENUE TREND DATA
 */
const getCachedRevenueTrend = (businessId: string) => unstable_cache(
    async () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const revTrendRes = await prisma.$queryRaw<{ month: Date; revenue: number; expenses: number }[]>`
            SELECT DATE_TRUNC('month', date) AS month,
            COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0)::float AS revenue,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float AS expenses
            FROM transactions WHERE date >= ${sixMonthsAgo} AND business_id = ${businessId} GROUP BY DATE_TRUNC('month', date) ORDER BY month ASC
        `;

        const revenueTrend: any[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const dbRow = revTrendRes.find(r => {
                const d = new Date(r.month);
                return d.getFullYear() === monthStart.getFullYear() && d.getMonth() === monthStart.getMonth();
            });
            revenueTrend.push({
                month: monthStart.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
                revenue: dbRow?.revenue || 0,
                expenses: dbRow?.expenses || 0,
            });
        }
        return serializeValues(revenueTrend);
    },
    [`dashboard-trend-${businessId}`],
    { tags: [`dashboard-charts`, `dashboard-charts-${businessId}`] }
)();

export async function getDashboardRevenueTrend(businessSlug?: string) {
    try {
        const ctx = await getBusinessContext(businessSlug);
        if (!hasPermission(ctx, 'dashboard', 'view')) throw new Error('Unauthorized');
        return await getCachedRevenueTrend(ctx.businessId);
    } catch (error) {
        console.error('Error fetching revenue trend:', error);
        return [];
    }
}

/**
 * SALES BY CHANNEL DATA
 */
const getCachedSalesByChannel = (businessId: string) => unstable_cache(
    async () => {
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);

        const salesChanRes = await prisma.order.groupBy({
            by: ['channel'],
            where: { date: { gte: firstOfMonth }, businessId },
            _sum: { grandTotal: true }
        });

        return serializeValues(salesChanRes.map(g => ({
            name: g.channel || 'other',
            value: Math.round(Number(g._sum.grandTotal || 0) * 100) / 100,
        })));
    },
    [`dashboard-channel-${businessId}`],
    { tags: [`dashboard-charts`, `dashboard-charts-${businessId}`] }
)();

export async function getDashboardSalesByChannel(businessSlug?: string) {
    try {
        const ctx = await getBusinessContext(businessSlug);
        if (!hasPermission(ctx, 'dashboard', 'view')) throw new Error('Unauthorized');
        return await getCachedSalesByChannel(ctx.businessId);
    } catch (error) {
        console.error('Error fetching sales by channel:', error);
        return [];
    }
}

/**
 * ACTIVITY FEED DATA
 */
const getCachedActivityFeed = (businessId: string) => unstable_cache(
    async () => {
        const activityFeed = await prisma.$queryRaw<any[]>`
            (SELECT 'order' as type, created_at as time, 
                json_build_object('number', order_number, 'status', status, 'amount', grand_total::float) as data
            FROM orders WHERE business_id = ${businessId} ORDER BY created_at DESC LIMIT 10)
            UNION ALL
            (SELECT 'stock' as type, created_at as time, 
                json_build_object('id', movement_id, 'type', type, 'qty', quantity::float) as data
            FROM stock_movements WHERE business_id = ${businessId} ORDER BY created_at DESC LIMIT 10)
            UNION ALL
            (SELECT 'production' as type, created_at as time, 
                json_build_object('number', batch_number, 'status', status) as data
            FROM production_batches WHERE business_id = ${businessId} ORDER BY created_at DESC LIMIT 10)
            ORDER BY time DESC LIMIT 20
        `;
        return serializeValues(activityFeed);
    },
    [`dashboard-feed-${businessId}`],
    { tags: [`dashboard-feed`, `dashboard-feed-${businessId}`] }
)();

export async function getDashboardActivityFeed(businessSlug?: string) {
    try {
        const ctx = await getBusinessContext(businessSlug);
        if (!hasPermission(ctx, 'dashboard', 'view')) throw new Error('Unauthorized');
        return await getCachedActivityFeed(ctx.businessId);
    } catch (error) {
        console.error('Error fetching activity feed:', error);
        return [];
    }
}

/**
 * LOW STOCK ALERTS DATA
 */
const getCachedLowStockAlerts = (businessId: string) => unstable_cache(
    async () => {
        const [lowRawRes, lowFinRes] = await Promise.all([
            prisma.rawMaterial.findMany({
                where: { reorderThreshold: { not: null }, deletedAt: null, businessId },
                select: { name: true, sku: true, currentStock: true, reorderThreshold: true }
            }),
            prisma.finishedProduct.findMany({
                select: { currentStock: true, reservedStock: true, reorderThreshold: true, sku: true, variant: true, product: { select: { name: true } } },
                where: { reorderThreshold: { not: null, gt: 0 }, businessId, product: { deletedAt: null } },
            }),
        ]);

        const alerts = [
            ...lowRawRes.filter(m => m.reorderThreshold && Number(m.currentStock) <= Number(m.reorderThreshold)).map(m => ({
                name: m.name, sku: m.sku, type: 'Raw Material' as const, currentStock: Number(m.currentStock), threshold: Number(m.reorderThreshold)
            })),
            ...lowFinRes.filter(p => p.reorderThreshold && (Number(p.currentStock) - Number(p.reservedStock)) <= Number(p.reorderThreshold)).map(p => ({
                name: `${p.product.name} - ${p.variant}`, sku: p.sku, type: 'Finished' as const, currentStock: Number(p.currentStock) - Number(p.reservedStock), threshold: Number(p.reorderThreshold)
            })),
        ];
        return serializeValues(alerts);
    },
    [`dashboard-lowstock-${businessId}`],
    { tags: [`dashboard-inventory`, `dashboard-inventory-${businessId}`] }
)();

export async function getDashboardLowStockAlerts(businessSlug?: string) {
    try {
        const ctx = await getBusinessContext(businessSlug);
        if (!hasPermission(ctx, 'dashboard', 'view')) throw new Error('Unauthorized');
        return await getCachedLowStockAlerts(ctx.businessId);
    } catch (error) {
        console.error('Error fetching low stock alerts:', error);
        return [];
    }
}
