'use server';

import prisma from '@/lib/prisma';

export async function getDashboardData() {
    try {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // ===================== KPIs =====================
        const [
            revenueThisMonth,
            revenueLastMonth,
            expensesThisMonth,
            expensesLastMonth,
            ordersThisMonth,
            ordersLastMonth,
            activeClients,
            rawMaterials,
            finishedProducts,
        ] = await Promise.all([
            // Revenue this month
            prisma.transaction.aggregate({
                where: { type: 'revenue', date: { gte: firstOfMonth } },
                _sum: { amount: true },
            }),
            // Revenue last month
            prisma.transaction.aggregate({
                where: { type: 'revenue', date: { gte: firstOfLastMonth, lt: firstOfMonth } },
                _sum: { amount: true },
            }),
            // Expenses this month
            prisma.transaction.aggregate({
                where: { type: 'expense', date: { gte: firstOfMonth } },
                _sum: { amount: true },
            }),
            // Expenses last month
            prisma.transaction.aggregate({
                where: { type: 'expense', date: { gte: firstOfLastMonth, lt: firstOfMonth } },
                _sum: { amount: true },
            }),
            // Orders this month
            prisma.order.count({ where: { date: { gte: firstOfMonth } } }),
            // Orders last month
            prisma.order.count({ where: { date: { gte: firstOfLastMonth, lt: firstOfMonth } } }),
            // Active clients
            prisma.client.count(),
            // Raw materials for inventory value
            prisma.rawMaterial.findMany({ select: { currentStock: true, unitCost: true } }),
            // Finished products for inventory value
            prisma.finishedProduct.findMany({ select: { currentStock: true, retailPrice: true } }),
        ]);

        const revMTD = revenueThisMonth._sum.amount ? Number(revenueThisMonth._sum.amount) : 0;
        const revLast = revenueLastMonth._sum.amount ? Number(revenueLastMonth._sum.amount) : 0;
        const expMTD = expensesThisMonth._sum.amount ? Number(expensesThisMonth._sum.amount) : 0;
        const expLast = expensesLastMonth._sum.amount ? Number(expensesLastMonth._sum.amount) : 0;
        const netProfit = revMTD - expMTD;

        // Inventory value
        const rawValue = rawMaterials.reduce((sum, m) => sum + (Number(m.currentStock) * Number(m.unitCost)), 0);
        const finishedValue = finishedProducts.reduce((sum, p) => sum + (Number(p.currentStock) * Number(p.retailPrice)), 0);
        const inventoryValue = rawValue + finishedValue;

        // % change helper
        const pctChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        // ===================== Charts =====================

        // Revenue Trend — last 6 months
        const revenueTrend: { month: string; revenue: number; expenses: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const monthLabel = monthStart.toLocaleString('en-US', { month: 'short', year: '2-digit' });

            const [rev, exp] = await Promise.all([
                prisma.transaction.aggregate({
                    where: { type: 'revenue', date: { gte: monthStart, lt: monthEnd } },
                    _sum: { amount: true },
                }),
                prisma.transaction.aggregate({
                    where: { type: 'expense', date: { gte: monthStart, lt: monthEnd } },
                    _sum: { amount: true },
                }),
            ]);

            revenueTrend.push({
                month: monthLabel,
                revenue: rev._sum.amount ? Number(rev._sum.amount) : 0,
                expenses: exp._sum.amount ? Number(exp._sum.amount) : 0,
            });
        }

        // Sales by Channel
        const orders = await prisma.order.findMany({
            where: { date: { gte: firstOfMonth } },
            select: { channel: true, grandTotal: true },
        });
        const channelMap: Record<string, number> = {};
        orders.forEach(o => {
            const ch = o.channel || 'other';
            channelMap[ch] = (channelMap[ch] || 0) + Number(o.grandTotal);
        });
        const salesByChannel = Object.entries(channelMap).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

        // ===================== Activity Feed =====================
        const [recentOrders, recentMovements, recentBatches] = await Promise.all([
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
        };
    }
}
