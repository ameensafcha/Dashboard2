'use server';

import prisma from '@/lib/prisma';
import { MaterialCategory, InventoryLocation } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getRawMaterials(
    search?: string,
    category?: MaterialCategory | 'all',
    location?: InventoryLocation | 'all'
) {
    try {
        const whereClause: any = { deletedAt: null };

        if (category && category !== 'all') {
            whereClause.category = category;
        }

        if (location && location !== 'all') {
            whereClause.location = location;
        }

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } }
            ];
        }

        const materials = await prisma.rawMaterial.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Serialize Decimals
        const serialized = materials.map(m => ({
            ...m,
            currentStock: m.currentStock ? Number(m.currentStock.toString()) : 0,
            unitCost: m.unitCost ? Number(m.unitCost.toString()) : 0,
            reorderThreshold: m.reorderThreshold ? Number(m.reorderThreshold.toString()) : null,
            reorderQuantity: m.reorderQuantity ? Number(m.reorderQuantity.toString()) : null,
        }));

        return { success: true, materials: serialized };
    } catch (error) {
        console.error('Failed to get raw materials:', error);
        return { success: false, error: 'Failed to fetch raw materials' };
    }
}

export type CreateRawMaterialInput = {
    name: string;
    skuNumber: string; // User inputs '001', system saves 'sku-001'
    category: MaterialCategory;
    currentStock: number;
    unitCost: number;
    reorderThreshold?: number;
    reorderQuantity?: number;
    location: InventoryLocation;
    expiryDate?: Date;
    supplierId?: string;
};

export async function createRawMaterial(data: CreateRawMaterialInput) {
    try {
        // Validate and construct SKU
        if (!data.skuNumber) {
            return { success: false, error: 'SKU Number is required' };
        }

        const generatedSku = `sku-${data.skuNumber.trim()}`;

        // Check if SKU already exists
        const existing = await prisma.rawMaterial.findUnique({
            where: { sku: generatedSku }
        });

        if (existing) {
            return { success: false, error: 'A material with this SKU already exists' };
        }

        const material = await prisma.rawMaterial.create({
            data: {
                name: data.name,
                sku: generatedSku,
                category: data.category,
                currentStock: data.currentStock,
                unitCost: data.unitCost,
                reorderThreshold: data.reorderThreshold,
                reorderQuantity: data.reorderQuantity,
                location: data.location,
                expiryDate: data.expiryDate,
                supplierId: data.supplierId
            }
        });

        revalidatePath('/inventory/raw-materials');
        revalidatePath('/inventory');
        revalidatePath('/');
        return { success: true, materialId: material.id };
    } catch (error) {
        console.error('Failed to create raw material:', error);
        return { success: false, error: 'Failed to create raw material' };
    }
}

export type UpdateRawMaterialInput = Partial<Omit<CreateRawMaterialInput, 'skuNumber'>> & {
    skuNumber?: string;
};

export async function updateRawMaterial(id: string, data: UpdateRawMaterialInput) {
    try {
        const updateData: any = { ...data };

        if (data.skuNumber) {
            updateData.sku = `sku-${data.skuNumber.trim()}`;
            delete updateData.skuNumber;

            // Check for uniqueness if changing SKU
            const existing = await prisma.rawMaterial.findUnique({
                where: { sku: updateData.sku }
            });
            if (existing && existing.id !== id) {
                return { success: false, error: 'A material with this SKU already exists' };
            }
        }

        await prisma.rawMaterial.update({
            where: { id },
            data: updateData
        });

        revalidatePath('/inventory/raw-materials');
        revalidatePath('/inventory');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to update raw material:', error);
        return { success: false, error: 'Failed to update material' };
    }
}

export async function deleteRawMaterial(id: string) {
    try {
        await prisma.rawMaterial.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        revalidatePath('/inventory/raw-materials');
        revalidatePath('/inventory');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete raw material:', error);
        return { success: false, error: 'Failed to delete material' };
    }
}
