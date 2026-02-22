'use server';

import prisma from '@/lib/prisma';

export async function getSalesOverview() {
    try {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [
            ordersThisMonth,
            ordersLastMonth,
            revenueThisMonth,
            revenueLastMonth,
            pendingOrders,
            recentOrders,
            channelOrders,
        ] = await Promise.all([
            prisma.order.count({ where: { date: { gte: firstOfMonth } } }),
            prisma.order.count({ where: { date: { gte: firstOfLastMonth, lt: firstOfMonth } } }),
            prisma.order.aggregate({
                where: { date: { gte: firstOfMonth }, status: 'delivered' },
                _sum: { grandTotal: true },
            }),
            prisma.order.aggregate({
                where: { date: { gte: firstOfLastMonth, lt: firstOfMonth }, status: 'delivered' },
                _sum: { grandTotal: true },
            }),
            prisma.order.count({ where: { status: { in: ['confirmed', 'processing'] } } }),
            prisma.order.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, orderNumber: true, status: true, channel: true,
                    grandTotal: true, date: true,
                    client: { select: { name: true } },
                },
            }),
            prisma.order.findMany({
                where: { date: { gte: firstOfMonth } },
                select: { channel: true, grandTotal: true },
            }),
        ]);

        const revMTD = revenueThisMonth._sum.grandTotal ? Number(revenueThisMonth._sum.grandTotal) : 0;
        const revLast = revenueLastMonth._sum.grandTotal ? Number(revenueLastMonth._sum.grandTotal) : 0;
        const avgOrderValue = ordersThisMonth > 0 ? revMTD / ordersThisMonth : 0;

        const pct = (cur: number, prev: number) => {
            if (prev === 0) return cur > 0 ? 100 : 0;
            return Math.round(((cur - prev) / prev) * 1000) / 10;
        };

        // Channel breakdown
        const channelMap: Record<string, number> = {};
        channelOrders.forEach(o => {
            const ch = o.channel || 'other';
            channelMap[ch] = (channelMap[ch] || 0) + Number(o.grandTotal);
        });
        const salesByChannel = Object.entries(channelMap).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

        return {
            kpis: {
                revenue: { value: revMTD, change: pct(revMTD, revLast) },
                orders: { value: ordersThisMonth, change: pct(ordersThisMonth, ordersLastMonth) },
                avgOrderValue: { value: Math.round(avgOrderValue * 100) / 100, change: 0 },
                pendingOrders: { value: pendingOrders, change: 0 },
            },
            recentOrders: recentOrders.map(o => ({
                ...o,
                grandTotal: Number(o.grandTotal),
            })),
            salesByChannel,
        };
    } catch (error) {
        console.error('Error fetching sales overview:', error);
        return {
            kpis: {
                revenue: { value: 0, change: 0 },
                orders: { value: 0, change: 0 },
                avgOrderValue: { value: 0, change: 0 },
                pendingOrders: { value: 0, change: 0 },
            },
            recentOrders: [],
            salesByChannel: [],
        };
    }
}
