'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getFinishedProducts(search?: string, location?: string) {
    try {
        const where: any = {};
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
                ...p,
                currentStock: p.currentStock ? Number(p.currentStock.toString()) : 0,
                reservedStock: p.reservedStock ? Number(p.reservedStock.toString()) : 0,
                unitCost: p.unitCost ? Number(p.unitCost.toString()) : 0,
                retailPrice: p.retailPrice ? Number(p.retailPrice.toString()) : 0,
                availableStock: Number(p.currentStock.toString()) - Number(p.reservedStock.toString()),
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
        return { success: true };
    } catch (error) {
        console.error('Error creating finished product:', error);
        return { success: false, error: 'Failed to create finished product.' };
    }
}
