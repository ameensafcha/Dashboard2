'use server';

import prisma from '@/lib/prisma';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { serializeValues } from '@/lib/utils';

export async function getProductsOverview() {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'products', 'view')) {
            throw new Error('Unauthorized');
        }

        const where: any = { deletedAt: null, businessId: ctx.businessId };

        const [totalProducts, totalCategories, productsByStatus, productsBySfda, recentProducts] = await Promise.all([
            prisma.product.count({ where }),
            prisma.category.count({ where: { deletedAt: null, businessId: ctx.businessId } }),
            prisma.product.groupBy({
                by: ['status'],
                where,
                _count: { status: true }
            }),
            prisma.product.groupBy({
                by: ['sfdaStatus'],
                where,
                _count: { sfdaStatus: true }
            }),
            prisma.product.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { category: true }
            })
        ]);

        const activeCount = productsByStatus.find(p => p.status === 'active')?._count.status || 0;
        const sfdaApprovedCount = productsBySfda.find(p => p.sfdaStatus === 'approved')?._count.sfdaStatus || 0;

        const data = {
            totalProducts,
            totalCategories,
            activeCount,
            sfdaApprovedCount,
            statusBreakdown: productsByStatus.map((p: any) => ({
                status: p.status,
                count: p._count.status
            })),
            sfdaBreakdown: productsBySfda.map((p: any) => ({
                status: p.sfdaStatus,
                count: p._count.sfdaStatus
            })),
            recentProducts
        };

        return serializeValues(data);
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
