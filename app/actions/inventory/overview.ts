'use server';

import prisma from '@/lib/prisma';

export async function getInventoryOverview() {
    try {
        const [rawMaterials, finishedProducts, recentMovements] = await Promise.all([
            prisma.rawMaterial.findMany({
                select: {
                    id: true, name: true, sku: true, category: true,
                    currentStock: true, unitCost: true,
                    reorderThreshold: true, expiryDate: true,
                },
            }),
            prisma.finishedProduct.findMany({
                select: {
                    id: true, sku: true, variant: true,
                    currentStock: true, reservedStock: true, unitCost: true, retailPrice: true,
                    expiryDate: true, reorderThreshold: true,
                    product: { select: { name: true } },
                },
            }),
            prisma.stockMovement.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    movementId: true, type: true, quantity: true, reason: true,
                    notes: true, createdAt: true,
                    rawMaterial: { select: { name: true } },
                    finishedProduct: { select: { variant: true, product: { select: { name: true } } } },
                },
            }),
        ]);

        // KPIs
        const rawInventoryValue = rawMaterials.reduce((sum, m) => sum + (Number(m.currentStock) * Number(m.unitCost)), 0);
        const finishedInventoryCost = finishedProducts.reduce((sum, p) => sum + (Number(p.currentStock) * Number(p.unitCost)), 0);
        const finishedInventoryRetail = finishedProducts.reduce((sum, p) => sum + (Number(p.currentStock) * Number(p.retailPrice)), 0);
        const totalValue = rawInventoryValue + finishedInventoryCost;

        // Low stock items
        const lowStockRaw = rawMaterials.filter(m =>
            m.reorderThreshold && Number(m.currentStock) <= Number(m.reorderThreshold)
        );
        const lowStockFinished = finishedProducts.filter(p => {
            const available = Number(p.currentStock) - Number(p.reservedStock);
            if (p.reorderThreshold) return available <= Number(p.reorderThreshold);
            return available <= 0;
        });

        // Expiring soon (30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringRaw = rawMaterials.filter(m =>
            m.expiryDate && new Date(m.expiryDate) <= thirtyDaysFromNow
        );
        const expiringFinished = finishedProducts.filter(p =>
            p.expiryDate && new Date(p.expiryDate) <= thirtyDaysFromNow
        );

        return {
            kpis: {
                totalValue: Math.round(totalValue * 100) / 100,
                rawInventoryValue: Math.round(rawInventoryValue * 100) / 100,
                finishedInventoryCost: Math.round(finishedInventoryCost * 100) / 100,
                finishedInventoryRetail: Math.round(finishedInventoryRetail * 100) / 100,
                rawMaterialsCount: rawMaterials.length,
                finishedProductsCount: finishedProducts.length,
                lowStockCount: lowStockRaw.length + lowStockFinished.length,
                expiringCount: expiringRaw.length + expiringFinished.length,
            },
            lowStockItems: [
                ...lowStockRaw.map(m => ({
                    name: m.name,
                    sku: m.sku,
                    type: 'raw' as const,
                    currentStock: Number(m.currentStock),
                    threshold: Number(m.reorderThreshold),
                })),
                ...lowStockFinished.map(p => ({
                    name: `${p.product.name} - ${p.variant}`,
                    sku: p.sku,
                    type: 'finished' as const,
                    currentStock: Number(p.currentStock) - Number(p.reservedStock),
                    threshold: p.reorderThreshold ? Number(p.reorderThreshold) : 0,
                })),
            ],
            expiringItems: [
                ...expiringRaw.map(m => ({
                    name: m.name,
                    sku: m.sku,
                    type: 'raw' as const,
                    expiryDate: m.expiryDate!.toISOString(),
                })),
                ...expiringFinished.map(p => ({
                    name: `${p.product.name} - ${p.variant}`,
                    sku: p.sku,
                    type: 'finished' as const,
                    expiryDate: p.expiryDate!.toISOString(),
                })),
            ],
            recentMovements: recentMovements.map(m => ({
                movementId: m.movementId,
                type: m.type,
                quantity: Number(m.quantity),
                reason: m.reason,
                itemName: m.rawMaterial?.name || (m.finishedProduct ? `${m.finishedProduct.product.name} - ${m.finishedProduct.variant}` : 'Unknown'),
                time: m.createdAt.toISOString(),
            })),
            stockBreakdown: [
                ...rawMaterials.map(m => ({
                    name: m.name,
                    sku: m.sku,
                    type: 'Raw Material' as const,
                    stock: Number(m.currentStock),
                    available: Number(m.currentStock),
                    value: Math.round(Number(m.currentStock) * Number(m.unitCost) * 100) / 100,
                })),
                ...finishedProducts.map(p => ({
                    name: `${p.product.name} - ${p.variant}`,
                    sku: p.sku,
                    type: 'Finished' as const,
                    stock: Number(p.currentStock),
                    available: Number(p.currentStock) - Number(p.reservedStock),
                    value: Math.round(Number(p.currentStock) * Number(p.unitCost) * 100) / 100,
                })),
            ],
        };
    } catch (error) {
        console.error('Error fetching inventory overview:', error);
        return {
            kpis: {
                totalValue: 0,
                rawInventoryValue: 0,
                finishedInventoryCost: 0,
                finishedInventoryRetail: 0,
                rawMaterialsCount: 0,
                finishedProductsCount: 0,
                lowStockCount: 0,
                expiringCount: 0
            },
            lowStockItems: [],
            expiringItems: [],
            recentMovements: [],
            stockBreakdown: [],
        };
    }
}
