'use server';

import prisma from '@/lib/prisma';

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
        const [products, categories, batches, rndProjects, suppliers] = await Promise.all([
            // Search Products
            prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { skuPrefix: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                take: 5,
                select: { id: true, name: true, skuPrefix: true },
            }),
            // Search Categories
            prisma.category.findMany({
                where: { name: { contains: searchTerm, mode: 'insensitive' } },
                take: 5,
                select: { id: true, name: true },
            }),
            // Search Production Batches
            prisma.productionBatch.findMany({
                where: { batchNumber: { contains: searchTerm, mode: 'insensitive' } },
                take: 5,
                select: { id: true, batchNumber: true, status: true },
            }),
            // Search R&D Projects
            prisma.rndProject.findMany({
                where: { name: { contains: searchTerm, mode: 'insensitive' } },
                take: 5,
                select: { id: true, name: true, status: true },
            }),
            // Search Suppliers
            prisma.supplier.findMany({
                where: { name: { contains: searchTerm, mode: 'insensitive' } },
                take: 5,
                select: { id: true, name: true },
            }),
        ]);

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
