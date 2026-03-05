'use server';

import prisma from '@/lib/prisma';
import { MaterialCategory, InventoryLocation } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';

export async function getRawMaterials(
    search?: string,
    category?: MaterialCategory | 'all',
    location?: InventoryLocation | 'all'
) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'inventory', 'view')) {
            throw new Error('Unauthorized');
        }

        const whereClause: any = { deletedAt: null, businessId: ctx.businessId };

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

        return serializeValues({ success: true, materials });
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
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'inventory', 'create')) {
            throw new Error('Unauthorized');
        }

        // Validate and construct SKU
        if (!data.skuNumber) {
            return { success: false, error: 'SKU Number is required' };
        }

        const generatedSku = `sku-${data.skuNumber.trim()}`;

        // Check if SKU already exists
        const existing = await prisma.rawMaterial.findUnique({
            where: { sku: generatedSku, businessId: ctx.businessId }
        });

        if (existing) {
            return { success: false, error: 'A material with this SKU already exists' };
        }

        const material = await prisma.$transaction(async (tx) => {
            const newMaterial = await tx.rawMaterial.create({
                data: {
                    businessId: ctx.businessId,
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

            await logAudit({
                action: 'CREATE',
                entity: 'RawMaterial',
                entityId: generatedSku,
                module: 'inventory',
                entityName: 'Raw Material',
                details: data
            });

            return newMaterial;
        }, { timeout: 15000 });

        revalidatePath('/inventory/raw-materials');
        revalidatePath('/inventory');
        revalidatePath('/');

        // Revalidate dashboard cache
        revalidateTag(`inventory-overview-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-inventory-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-feed-${ctx.businessId}`, { expire: 0 });

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
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'inventory', 'edit')) {
            throw new Error('Unauthorized');
        }

        const rm = await prisma.rawMaterial.findUnique({ where: { id, businessId: ctx.businessId } });
        if (!rm) throw new Error('Not found')

        const updateData: any = { ...data };

        if (data.skuNumber) {
            updateData.sku = `sku-${data.skuNumber.trim()}`;
            delete updateData.skuNumber;

            // Check for uniqueness if changing SKU
            const existing = await prisma.rawMaterial.findUnique({
                where: { sku: updateData.sku, businessId: ctx.businessId }
            });
            if (existing && existing.id !== id) {
                return { success: false, error: 'A material with this SKU already exists' };
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.rawMaterial.update({
                where: { id },
                data: updateData
            });

            await logAudit({
                action: 'UPDATE',
                entity: 'RawMaterial',
                entityId: updateData.sku || rm.sku,
                module: 'inventory',
                entityName: 'Raw Material',
                details: data
            });
        }, { timeout: 15000 });

        revalidatePath('/inventory/raw-materials');
        revalidatePath('/inventory');
        revalidatePath('/');

        // Revalidate dashboard cache
        revalidateTag(`inventory-overview-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-inventory-${ctx.businessId}`, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('Failed to update raw material:', error);
        return { success: false, error: 'Failed to update material' };
    }
}


export async function deleteRawMaterial(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'inventory', 'delete')) {
            throw new Error('Unauthorized');
        }

        const rm = await prisma.rawMaterial.findUnique({ where: { id, businessId: ctx.businessId } });
        if (!rm) throw new Error('Not found')

        await prisma.$transaction(async (tx) => {
            await tx.rawMaterial.update({
                where: { id },
                data: { deletedAt: new Date() }
            });

            await logAudit({
                action: 'SOFT_DELETE',
                entity: 'RawMaterial',
                entityId: rm.sku,
                module: 'inventory',
                entityName: 'Raw Material',
            });
        }, { timeout: 15000 });

        revalidatePath('/inventory/raw-materials');
        revalidatePath('/inventory');
        revalidatePath('/');

        // Revalidate dashboard cache
        revalidateTag(`inventory-overview-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-inventory-${ctx.businessId}`, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('Failed to delete raw material:', error);
        return { success: false, error: 'Failed to delete material' };
    }
}

