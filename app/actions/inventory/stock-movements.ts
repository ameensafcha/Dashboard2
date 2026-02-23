'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { StockMovementType, StockMovementReason } from '@prisma/client';
import { toSafeNumber } from '@/lib/decimal';

// ==========================================
// Validation Schemas
// ==========================================

const logMovementSchema = z.object({
    type: z.nativeEnum(StockMovementType),
    quantity: z.number().positive('Quantity must be greater than 0'),
    reason: z.nativeEnum(StockMovementReason),
    notes: z.string().optional(),
    referenceId: z.string().optional(),
    rawMaterialId: z.string().optional(),
    finishedProductId: z.string().optional(),
}).refine(data => data.rawMaterialId || data.finishedProductId, {
    message: "Must specify a Raw Material or Finished Product.",
    path: ["rawMaterialId"], // Reference path
});

export type LogMovementInput = z.infer<typeof logMovementSchema>;

// ==========================================
// Queries
// ==========================================

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
                quantity: toSafeNumber(m.quantity, 3),
            })),
        };
    } catch (error) {
        console.error('Error fetching stock movements:', error);
        return { success: false, movements: [] };
    }
}

// ==========================================
// Helper Functions
// ==========================================

async function generateMovementId(tx: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SM-${year}`;
    const last = await tx.stockMovement.findFirst({
        where: { movementId: { startsWith: prefix } },
        orderBy: { movementId: 'desc' },
        select: { movementId: true },
    });
    let nextNum = 1;
    if (last) {
        const parts = last.movementId.split('-');
        const num = parseInt(parts[2]);
        if (!isNaN(num)) nextNum = num + 1;
    }
    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

// ==========================================
// Mutations
// ==========================================

export async function logMovement(data: LogMovementInput) {
    try {
        // Validate
        const parsed = logMovementSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }
        const validated = parsed.data;

        // Determine the stock change direction
        const isIncrease = validated.type === 'STOCK_IN' || validated.type === 'RETURN';
        const stockDelta = isIncrease ? Math.abs(validated.quantity) : -Math.abs(validated.quantity);

        let movementId = '';

        await prisma.$transaction(async (tx) => {
            // Generate ID inside transaction to prevent race conditions
            movementId = await generateMovementId(tx);

            // 1. Create the movement log
            await tx.stockMovement.create({
                data: {
                    movementId,
                    type: validated.type,
                    quantity: validated.quantity,
                    reason: validated.reason,
                    notes: validated.notes || null,
                    referenceId: validated.referenceId || null,
                    rawMaterialId: validated.rawMaterialId || null,
                    finishedProductId: validated.finishedProductId || null,
                },
            });

            // 2. Update the corresponding inventory balance
            if (validated.rawMaterialId) {
                await tx.rawMaterial.update({
                    where: { id: validated.rawMaterialId },
                    data: { currentStock: { increment: stockDelta } },
                });
            }
            if (validated.finishedProductId) {
                await tx.finishedProduct.update({
                    where: { id: validated.finishedProductId },
                    data: { currentStock: { increment: stockDelta } },
                });
            }
        });

        revalidatePath('/inventory/raw-materials');
        revalidatePath('/inventory/finished');
        revalidatePath('/inventory');
        revalidatePath('/');
        return { success: true, movementId };
    } catch (error) {
        console.error('Error logging stock movement:', error);
        return { success: false, error: 'Failed to log stock movement.' };
    }
}
