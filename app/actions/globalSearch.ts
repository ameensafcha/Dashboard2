'use server';

import prisma from '@/lib/prisma';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';

export interface SearchResult {
    id: string;
    type: 'Product' | 'Category' | 'Production Batch' | 'R&D Project' | 'Supplier' | 'Variant';
    title: string;
    subtitle?: string;
    href: string;
}

export async function performGlobalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.trim() === '') {
        return [];
    }

    const searchTerm = query.trim();

    try {
        const ctx = await getBusinessContext();

        const searchPromises = [];

        // Search Products (Check 'products.view')
        if (hasPermission(ctx, 'products', 'view')) {
            searchPromises.push(prisma.product.findMany({
                where: {
                    businessId: ctx.businessId,
                    deletedAt: null,
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { skuPrefix: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                take: 5,
                select: { id: true, name: true, skuPrefix: true },
            }));
        } else {
            searchPromises.push(Promise.resolve([]));
        }

        // Search Categories (Check 'products.view')
        if (hasPermission(ctx, 'products', 'view')) {
            searchPromises.push(prisma.category.findMany({
                where: { name: { contains: searchTerm, mode: 'insensitive' }, businessId: ctx.businessId, deletedAt: null },
                take: 5,
                select: { id: true, name: true },
            }));
        } else {
            searchPromises.push(Promise.resolve([]));
        }

        // Search Production Batches (Check 'production.view')
        if (hasPermission(ctx, 'production', 'view')) {
            searchPromises.push(prisma.productionBatch.findMany({
                where: { batchNumber: { contains: searchTerm, mode: 'insensitive' }, businessId: ctx.businessId, deletedAt: null },
                take: 5,
                select: { id: true, batchNumber: true, status: true },
            }));
        } else {
            searchPromises.push(Promise.resolve([]));
        }

        // Search R&D Projects (Check 'production.view')
        if (hasPermission(ctx, 'production', 'view')) {
            searchPromises.push(prisma.rndProject.findMany({
                where: { name: { contains: searchTerm, mode: 'insensitive' }, businessId: ctx.businessId },
                take: 5,
                select: { id: true, name: true, status: true },
            }));
        } else {
            searchPromises.push(Promise.resolve([]));
        }

        // Search Suppliers (Check 'inventory.view')
        if (hasPermission(ctx, 'inventory', 'view')) {
            searchPromises.push(prisma.supplier.findMany({
                where: { name: { contains: searchTerm, mode: 'insensitive' }, businessId: ctx.businessId, deletedAt: null },
                take: 5,
                select: { id: true, name: true },
            }));
        } else {
            searchPromises.push(Promise.resolve([]));
        }

        const searchResults = await Promise.all(searchPromises);
        const products = searchResults[0] as any[];
        const categories = searchResults[1] as any[];
        const batches = searchResults[2] as any[];
        const rndProjects = searchResults[3] as any[];
        const suppliers = searchResults[4] as any[];

        const results: SearchResult[] = [];

        products.forEach((p) => {
            results.push({
                id: `prod-${p.id}`,
                type: 'Product',
                title: p.name,
                subtitle: `SKU: ${p.skuPrefix}`,
                href: `/products/catalog?search=${encodeURIComponent(p.name)}`,
            });
        });

        categories.forEach((c) => {
            results.push({
                id: `cat-${c.id}`,
                type: 'Category',
                title: c.name,
                href: `/products/categories?search=${encodeURIComponent(c.name)}`,
            });
        });

        batches.forEach((b) => {
            results.push({
                id: `batch-${b.id}`,
                type: 'Production Batch',
                title: b.batchNumber,
                subtitle: `Status: ${b.status}`,
                href: `/production/batches/${b.id}`,
            });
        });

        rndProjects.forEach((r) => {
            results.push({
                id: `rnd-${r.id}`,
                type: 'R&D Project',
                title: r.name,
                subtitle: `Status: ${r.status}`,
                href: `/production/rnd?search=${encodeURIComponent(r.name)}`,
            });
        });

        suppliers.forEach((s) => {
            results.push({
                id: `sup-${s.id}`,
                type: 'Supplier',
                title: s.name,
                href: `/products/suppliers?search=${encodeURIComponent(s.name)}`,
            });
        });

        // Return combined results
        return results;
    } catch (error) {
        console.error('Error performing global search:', error);
        return [];
    }
}
