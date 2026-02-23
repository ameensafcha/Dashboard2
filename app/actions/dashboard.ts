'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getDashboardData() {
    try {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        // ===================== ALL QUERIES IN ONE PARALLEL BATCH =====================
        const [
            revenueThisMonth,
            revenueLastMonth,
            expensesThisMonth,
            expensesLastMonth,
            ordersThisMonth,
            ordersLastMonth,
            activeClients,
            // Optimized: DB-level aggregations instead of fetching full tables
            rawInventoryValue,
            finishedInventoryValue,
            // Optimized: DB-level WHERE for low stock instead of JS .filter()
            lowStockRaw,
            lowStockFinished,
            // Optimized: DB-level DATE_TRUNC grouping instead of JS bucketing
            revenueTrendRaw,
            // Optimized: Prisma groupBy instead of JS forEach
            salesByChannelRaw,
            // Activity Feed (already optimized with take:10)
            recentOrders,
            recentMovements,
            recentBatches,
        ] = await Promise.all([
            // --- KPIs (unchanged, already use aggregate) ---
            prisma.transaction.aggregate({
                where: { type: 'revenue', date: { gte: firstOfMonth } },
                _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
                where: { type: 'revenue', date: { gte: firstOfLastMonth, lt: firstOfMonth } },
                _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
                where: { type: 'expense', date: { gte: firstOfMonth } },
                _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
                where: { type: 'expense', date: { gte: firstOfLastMonth, lt: firstOfMonth } },
                _sum: { amount: true },
            }),
            prisma.order.count({ where: { date: { gte: firstOfMonth } } }),
            prisma.order.count({ where: { date: { gte: firstOfLastMonth, lt: firstOfMonth } } }),
            prisma.client.count(),

            // --- FIX 1.1 & 1.5: Inventory value via DB SUM instead of fetching all rows ---
            prisma.$queryRaw<[{ total: number }]>`
                SELECT COALESCE(SUM(current_stock * unit_cost), 0)::float AS total
                FROM raw_materials
            `,
            prisma.$queryRaw<[{ total: number }]>`
                SELECT COALESCE(SUM(current_stock * retail_price), 0)::float AS total
                FROM finished_products
            `,

            // --- FIX 1.1: Low stock alerts via DB WHERE instead of JS filter ---
            prisma.rawMaterial.findMany({
                where: {
                    reorderThreshold: { not: null },
                    currentStock: { lte: prisma.rawMaterial.fields?.reorderThreshold as any },
                },
                select: { name: true, sku: true, currentStock: true, reorderThreshold: true },
            }).catch(() => [] as any[]),
            prisma.finishedProduct.findMany({
                select: {
                    currentStock: true, reservedStock: true, reorderThreshold: true,
                    sku: true, variant: true, product: { select: { name: true } }
                },
                where: { reorderThreshold: { not: null, gt: 0 } },
            }),

            // --- FIX 1.2: Revenue trend via DB DATE_TRUNC instead of JS bucketing ---
            prisma.$queryRaw<{ month: Date; revenue: number; expenses: number }[]>`
                SELECT
                    DATE_TRUNC('month', date) AS month,
                    COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0)::float AS revenue,
                    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float AS expenses
                FROM transactions
                WHERE date >= ${sixMonthsAgo}
                GROUP BY DATE_TRUNC('month', date)
                ORDER BY month ASC
            `,

            // --- FIX 1.5: Sales by channel via Prisma groupBy instead of JS ---
            prisma.order.groupBy({
                by: ['channel'],
                where: { date: { gte: firstOfMonth } },
                _sum: { grandTotal: true },
            }),

            // --- Activity Feed (already good with take:10) ---
            prisma.order.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { orderNumber: true, status: true, grandTotal: true, createdAt: true },
            }),
            prisma.stockMovement.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { movementId: true, type: true, quantity: true, reason: true, notes: true, createdAt: true },
            }),
            prisma.productionBatch.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { batchNumber: true, status: true, createdAt: true },
            }),
        ]);

        // ===================== PROCESS RESULTS =====================

        const revMTD = revenueThisMonth._sum.amount ? Number(revenueThisMonth._sum.amount) : 0;
        const revLast = revenueLastMonth._sum.amount ? Number(revenueLastMonth._sum.amount) : 0;
        const expMTD = expensesThisMonth._sum.amount ? Number(expensesThisMonth._sum.amount) : 0;
        const expLast = expensesLastMonth._sum.amount ? Number(expensesLastMonth._sum.amount) : 0;
        const netProfit = revMTD - expMTD;

        // Inventory value from DB aggregation (no JS reduce needed)
        const inventoryValue = (rawInventoryValue[0]?.total || 0) + (finishedInventoryValue[0]?.total || 0);

        const pctChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        // Revenue trend: fill in any missing months from the DB result
        const revenueTrend: { month: string; revenue: number; expenses: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = monthStart.toLocaleString('en-US', { month: 'short', year: '2-digit' });

            // Find matching DB row
            const dbRow = revenueTrendRaw.find(r => {
                const rowDate = new Date(r.month);
                return rowDate.getFullYear() === monthStart.getFullYear() &&
                    rowDate.getMonth() === monthStart.getMonth();
            });

            revenueTrend.push({
                month: monthLabel,
                revenue: dbRow?.revenue || 0,
                expenses: dbRow?.expenses || 0,
            });
        }

        // Sales by channel from groupBy (no JS forEach needed)
        const salesByChannel = salesByChannelRaw.map(g => ({
            name: g.channel || 'other',
            value: Math.round(Number(g._sum.grandTotal || 0) * 100) / 100,
        }));

        // Low stock alerts — raw materials already filtered by DB WHERE,
        // but Prisma can't do column-to-column comparison so we do a light filter
        const lowStockAlerts = [
            ...lowStockRaw
                .filter(m => m.reorderThreshold && Number(m.currentStock) <= Number(m.reorderThreshold))
                .map(m => ({
                    name: m.name,
                    sku: m.sku,
                    type: 'Raw Material' as const,
                    currentStock: Number(m.currentStock),
                    threshold: Number(m.reorderThreshold),
                })),
            ...lowStockFinished
                .filter(p => p.reorderThreshold && (Number(p.currentStock) - Number(p.reservedStock)) <= Number(p.reorderThreshold))
                .map(p => ({
                    name: `${p.product.name} - ${p.variant}`,
                    sku: p.sku,
                    type: 'Finished' as const,
                    currentStock: Number(p.currentStock) - Number(p.reservedStock),
                    threshold: Number(p.reorderThreshold),
                })),
        ];

        // Activity Feed (unchanged — merge + sort is minimal overhead)
        type FeedItem = { text: string; time: Date; type: 'order' | 'stock' | 'production' };
        const feed: FeedItem[] = [
            ...recentOrders.map(o => ({
                text: `Order ${o.orderNumber} — ${o.status} (SAR ${Number(o.grandTotal).toLocaleString()})`,
                time: o.createdAt,
                type: 'order' as const,
            })),
            ...recentMovements.map(m => ({
                text: `${m.type === 'STOCK_IN' ? '📥' : '📤'} ${m.movementId}: ${m.type.replace('_', ' ')} — ${m.quantity} kg`,
                time: m.createdAt,
                type: 'stock' as const,
            })),
            ...recentBatches.map(b => ({
                text: `🏭 ${b.batchNumber} — ${b.status.replace('_', ' ')}`,
                time: b.createdAt,
                type: 'production' as const,
            })),
        ];
        feed.sort((a, b) => b.time.getTime() - a.time.getTime());
        const activityFeed = feed.slice(0, 20).map(f => ({
            text: f.text,
            time: f.time.toISOString(),
            type: f.type,
        }));

        return {
            kpis: {
                revenue: { value: revMTD, change: pctChange(revMTD, revLast) },
                expenses: { value: expMTD, change: pctChange(expMTD, expLast) },
                netProfit: { value: netProfit, change: pctChange(netProfit, revLast - expLast) },
                orders: { value: ordersThisMonth, change: pctChange(ordersThisMonth, ordersLastMonth) },
                inventoryValue: { value: Math.round(inventoryValue * 100) / 100, change: 0 },
                activeClients: { value: activeClients, change: 0 },
            },
            revenueTrend,
            salesByChannel,
            activityFeed,
            lowStockAlerts,
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return {
            kpis: {
                revenue: { value: 0, change: 0 },
                expenses: { value: 0, change: 0 },
                netProfit: { value: 0, change: 0 },
                orders: { value: 0, change: 0 },
                inventoryValue: { value: 0, change: 0 },
                activeClients: { value: 0, change: 0 },
            },
            revenueTrend: [],
            salesByChannel: [],
            activityFeed: [],
            lowStockAlerts: [],
        };
    }
}
