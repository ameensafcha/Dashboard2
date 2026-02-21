'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getStockMovements(filters?: {
    rawMaterialId?: string;
    finishedProductId?: string;
    type?: string;
    limit?: number;
}) {
    try {
        const where: any = {};
        if (filters?.rawMaterialId) where.rawMaterialId = filters.rawMaterialId;
        if (filters?.finishedProductId) where.finishedProductId = filters.finishedProductId;
        if (filters?.type && filters.type !== 'ALL') where.type = filters.type;

        const movements = await prisma.stockMovement.findMany({
            where,
            include: {
                rawMaterial: { select: { name: true, sku: true } },
                finishedProduct: { select: { variant: true, sku: true, product: { select: { name: true } } } },
            },
            orderBy: { date: 'desc' },
            take: filters?.limit || 50,
        });

        return {
            success: true,
            movements: movements.map(m => ({
                ...m,
                quantity: m.quantity ? Number(m.quantity.toString()) : 0,
            })),
        };
    } catch (error) {
        console.error('Error fetching stock movements:', error);
        return { success: false, movements: [] };
    }
}

async function generateMovementId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.stockMovement.count({
        where: {
            movementId: { startsWith: `SM-${year}` },
        },
    });
    return `SM-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function logMovement(data: {
    type: string;
    quantity: number;
    reason: string;
    notes?: string;
    referenceId?: string;
    rawMaterialId?: string;
    finishedProductId?: string;
}) {
    try {
        if (!data.type || !data.quantity || !data.reason) {
            return { success: false, error: 'Type, Quantity, and Reason are required.' };
        }
        if (!data.rawMaterialId && !data.finishedProductId) {
            return { success: false, error: 'Must specify a Raw Material or Finished Product.' };
        }

        const movementId = await generateMovementId();

        // Determine the stock change direction
        const isIncrease = data.type === 'STOCK_IN' || data.type === 'RETURN';
        const stockDelta = isIncrease ? Math.abs(data.quantity) : -Math.abs(data.quantity);

        await prisma.$transaction(async (tx) => {
            // 1. Create the movement log
            await tx.stockMovement.create({
                data: {
                    movementId,
                    type: data.type as any,
                    quantity: data.quantity,
                    reason: data.reason as any,
                    notes: data.notes || null,
                    referenceId: data.referenceId || null,
                    rawMaterialId: data.rawMaterialId || null,
                    finishedProductId: data.finishedProductId || null,
                },
            });

            // 2. Update the corresponding inventory balance
            if (data.rawMaterialId) {
                await tx.rawMaterial.update({
                    where: { id: data.rawMaterialId },
                    data: { currentStock: { increment: stockDelta } },
                });
            }
            if (data.finishedProductId) {
                await tx.finishedProduct.update({
                    where: { id: data.finishedProductId },
                    data: { currentStock: { increment: stockDelta } },
                });
            }
        });

        revalidatePath('/inventory/raw-materials');
        revalidatePath('/inventory/finished');
        return { success: true, movementId };
    } catch (error) {
        console.error('Error logging stock movement:', error);
        return { success: false, error: 'Failed to log stock movement.' };
    }
}
