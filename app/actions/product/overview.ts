'use server';

import prisma from '@/lib/prisma';

export async function getProductsOverview() {
    try {
        const [totalProducts, totalCategories, productsByStatus, productsBySfda, recentProducts] = await Promise.all([
            prisma.product.count(),
            prisma.category.count(),
            prisma.product.groupBy({
                by: ['status'],
                _count: { status: true }
            }),
            prisma.product.groupBy({
                by: ['sfdaStatus'],
                _count: { sfdaStatus: true }
            }),
            prisma.product.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { category: true }
            })
        ]);

        const activeCount = productsByStatus.find(p => p.status === 'active')?._count.status || 0;
        const sfdaApprovedCount = productsBySfda.find(p => p.sfdaStatus === 'approved')?._count.sfdaStatus || 0;

        return {
            totalProducts,
            totalCategories,
            activeCount,
            sfdaApprovedCount,
            statusBreakdown: productsByStatus.map(p => ({
                status: p.status,
                count: p._count.status
            })),
            sfdaBreakdown: productsBySfda.map(p => ({
                status: p.sfdaStatus,
                count: p._count.sfdaStatus
            })),
            recentProducts: recentProducts.map(p => ({
                ...p,
                baseCost: Number(p.baseCost),
                baseRetailPrice: Number(p.baseRetailPrice),
                size: p.size ? Number(p.size) : null
            }))
        };
    } catch (error) {
        console.error('Error fetching products overview:', error);
        return {
            totalProducts: 0,
            totalCategories: 0,
            activeCount: 0,
            sfdaApprovedCount: 0,
            statusBreakdown: [],
            sfdaBreakdown: [],
            recentProducts: []
        };
    }
}
