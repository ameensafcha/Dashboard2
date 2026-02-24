'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { toSafeNumber } from '@/lib/decimal';

export async function getFinishedProducts(search?: string, location?: string) {
    try {
        const where: any = { deletedAt: null };
        if (search) {
            where.OR = [
                { sku: { contains: search, mode: 'insensitive' } },
                { variant: { contains: search, mode: 'insensitive' } },
                { product: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (location && location !== 'ALL') {
            where.location = location;
        }

        const products = await prisma.finishedProduct.findMany({
            where,
            include: { product: { select: { id: true, name: true, skuPrefix: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            products: products.map(p => ({
                id: p.id,
                productId: p.productId,
                variant: p.variant,
                sku: p.sku,
                currentStock: toSafeNumber(p.currentStock, 3),
                reservedStock: toSafeNumber(p.reservedStock, 3),
                unitCost: toSafeNumber(p.unitCost, 2),
                retailPrice: toSafeNumber(p.retailPrice, 2),
                reorderThreshold: toSafeNumber(p.reorderThreshold, 3),
                availableStock: toSafeNumber(p.currentStock, 3) - toSafeNumber(p.reservedStock, 3),
                location: p.location,
                batchNumber: p.batchNumber,
                expiryDate: p.expiryDate,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                product: p.product ? {
                    id: p.product.id,
                    name: p.product.name,
                    skuPrefix: p.product.skuPrefix
                } : null
            })),
        };
    } catch (error) {
        console.error('Error fetching finished products:', error);
        return { success: false, products: [] };
    }
}

export async function createFinishedProduct(data: {
    productId: string;
    variant: string;
    skuNumber: string;
    currentStock: number;
    reservedStock?: number;
    unitCost: number;
    retailPrice: number;
    location: string;
    batchNumber?: string;
    expiryDate?: string;
}) {
    try {
        if (!data.productId || !data.variant || !data.skuNumber) {
            return { success: false, error: 'Product, Variant, and SKU are required.' };
        }

        const sku = `fp-${data.skuNumber}`;
        const existing = await prisma.finishedProduct.findUnique({ where: { sku } });
        if (existing) return { success: false, error: `SKU "${sku}" already exists.` };

        await prisma.finishedProduct.create({
            data: {
                productId: data.productId,
                variant: data.variant,
                sku,
                currentStock: data.currentStock,
                reservedStock: data.reservedStock || 0,
                unitCost: data.unitCost,
                retailPrice: data.retailPrice,
                location: data.location as any,
                batchNumber: data.batchNumber || null,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            },
        });

        revalidatePath('/inventory/finished');
        revalidatePath('/inventory');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error creating finished product:', error);
        return { success: false, error: 'Failed to create finished product.' };
    }
}

export async function deleteFinishedProduct(id: string) {
    try {
        await prisma.finishedProduct.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        revalidatePath('/inventory/finished');
        revalidatePath('/inventory');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting finished product:', error);
        return { success: false, error: 'Failed to delete finished product' };
    }
}

export async function updateFinishedProduct(id: string, data: {
    variant?: string;
    sku?: string;
    currentStock?: number;
    reservedStock?: number;
    unitCost?: number;
    retailPrice?: number;
    location?: string;
    reorderThreshold?: number;
    expiryDate?: string | null;
}) {
    try {
        const updateData: any = { ...data };

        if (data.expiryDate !== undefined) {
            updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
        }

        await prisma.finishedProduct.update({
            where: { id },
            data: updateData
        });

        revalidatePath('/inventory/finished');
        revalidatePath('/inventory');
        revalidatePath('/');

        return { success: true };
    } catch (error) {
        console.error('Error updating finished product:', error);
        return { success: false, error: 'Failed to update finished product.' };
    }
}
