'use server';

import prisma from '@/lib/prisma';

export async function getDashboardData() {
    try {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        // ===================== ALL QUERIES IN ONE PARALLEL BATCH =====================
        const [
            revMTD_res, revLast_res, expMTD_res, expLast_res, ordMTD_res, ordLast_res, clientRes,
            rawInvRes, finInvRes, lowRawRes, lowFinRes, revTrendRes, salesChanRes, activityFeed
        ] = await Promise.all([
            // --- KPIs ---
            prisma.transaction.aggregate({ where: { type: 'revenue', date: { gte: firstOfMonth } }, _sum: { amount: true } }),
            prisma.transaction.aggregate({ where: { type: 'revenue', date: { gte: firstOfLastMonth, lt: firstOfMonth } }, _sum: { amount: true } }),
            prisma.transaction.aggregate({ where: { type: 'expense', date: { gte: firstOfMonth } }, _sum: { amount: true } }),
            prisma.transaction.aggregate({ where: { type: 'expense', date: { gte: firstOfLastMonth, lt: firstOfMonth } }, _sum: { amount: true } }),
            prisma.order.count({ where: { date: { gte: firstOfMonth } } }),
            prisma.order.count({ where: { date: { gte: firstOfLastMonth, lt: firstOfMonth } } }),
            prisma.client.count(),
            // --- Inventory ---
            prisma.$queryRaw<[{ total: number }]>`SELECT COALESCE(SUM(current_stock * unit_cost), 0)::float AS total FROM raw_materials`,
            prisma.$queryRaw<[{ total: number }]>`SELECT COALESCE(SUM(current_stock * retail_price), 0)::float AS total FROM finished_products`,
            // --- Low Stock ---
            prisma.rawMaterial.findMany({
                where: { reorderThreshold: { not: null } },
                select: { name: true, sku: true, currentStock: true, reorderThreshold: true }
            }),
            prisma.finishedProduct.findMany({
                select: { currentStock: true, reservedStock: true, reorderThreshold: true, sku: true, variant: true, product: { select: { name: true } } },
                where: { reorderThreshold: { not: null, gt: 0 } },
            }),
            // --- Trend ---
            prisma.$queryRaw<{ month: Date; revenue: number; expenses: number }[]>`
                SELECT DATE_TRUNC('month', date) AS month,
                COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0)::float AS revenue,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float AS expenses
                FROM transactions WHERE date >= ${sixMonthsAgo} GROUP BY DATE_TRUNC('month', date) ORDER BY month ASC
            `,
            // --- Channels ---
            prisma.order.groupBy({ by: ['channel'], where: { date: { gte: firstOfMonth } }, _sum: { grandTotal: true } }),
            // --- Activity Feed (Optimized UNION) ---
            prisma.$queryRaw<any[]>`
                (SELECT 'order' as type, created_at as time, 
                    json_build_object('number', order_number, 'status', status, 'amount', grand_total::float) as data
                FROM orders ORDER BY created_at DESC LIMIT 10)
                UNION ALL
                (SELECT 'stock' as type, created_at as time, 
                    json_build_object('id', movement_id, 'type', type, 'qty', quantity::float) as data
                FROM stock_movements ORDER BY created_at DESC LIMIT 10)
                UNION ALL
                (SELECT 'production' as type, created_at as time, 
                    json_build_object('number', batch_number, 'status', status) as data
                FROM production_batches ORDER BY created_at DESC LIMIT 10)
                ORDER BY time DESC LIMIT 20
            `,
        ]);

        // ===================== PROCESS RESULTS =====================

        const revMTD = revMTD_res._sum.amount ? Number(revMTD_res._sum.amount) : 0;
        const revLast = revLast_res._sum.amount ? Number(revLast_res._sum.amount) : 0;
        const expMTD = expMTD_res._sum.amount ? Number(expMTD_res._sum.amount) : 0;
        const expLast = expLast_res._sum.amount ? Number(expLast_res._sum.amount) : 0;
        const netProfit = revMTD - expMTD;
        const inventoryValue = (rawInvRes[0]?.total || 0) + (finInvRes[0]?.total || 0);

        const pctChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        const revenueTrend: any[] = [];
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

        const salesByChannel = salesChanRes.map(g => ({
            name: g.channel || 'other',
            value: Math.round(Number(g._sum.grandTotal || 0) * 100) / 100,
        }));

        const lowStockAlerts = [
            ...lowRawRes.filter(m => m.reorderThreshold && Number(m.currentStock) <= Number(m.reorderThreshold)).map(m => ({
                name: m.name, sku: m.sku, type: 'Raw Material' as const, currentStock: Number(m.currentStock), threshold: Number(m.reorderThreshold)
            })),
            ...lowFinRes.filter(p => p.reorderThreshold && (Number(p.currentStock) - Number(p.reservedStock)) <= Number(p.reorderThreshold)).map(p => ({
                name: `${p.product.name} - ${p.variant}`, sku: p.sku, type: 'Finished' as const, currentStock: Number(p.currentStock) - Number(p.reservedStock), threshold: Number(p.reorderThreshold)
            })),
        ];

        return {
            kpis: {
                revenue: { value: revMTD, change: pctChange(revMTD, revLast) },
                expenses: { value: expMTD, change: pctChange(expMTD, expLast) },
                netProfit: { value: netProfit, change: pctChange(netProfit, revLast - expLast) },
                orders: { value: ordMTD_res, change: pctChange(ordMTD_res, ordLast_res) },
                inventoryValue: { value: Math.round(inventoryValue * 100) / 100, change: 0 },
                activeClients: { value: clientRes, change: 0 },
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
