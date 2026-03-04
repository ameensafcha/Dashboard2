'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DealStage } from '@prisma/client';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';

const dealSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    value: z.number().min(0).default(0),
    stage: z.nativeEnum(DealStage).default(DealStage.new_lead),
    expectedCloseDate: z.date().optional().nullable(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    clientId: z.string().optional().nullable(),
    companyId: z.string().optional().nullable(),
    notes: z.string().optional(),
});

export async function getDeals(search?: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'view')) {
            throw new Error('Unauthorized');
        }

        const whereClause: any = { deletedAt: null, businessId: ctx.businessId };

        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                {
                    company: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                },
                {
                    client: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                }
            ];
        }

        const deals = await prisma.deal.findMany({
            where: whereClause,
            include: {
                company: {
                    select: { id: true, name: true, industry: true }
                },
                client: {
                    select: { id: true, name: true, email: true, phone: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });

        return deals.map(deal => ({
            ...deal,
            value: Number(deal.value),
        }));
    } catch (error) {
        console.error('Error fetching deals:', error);
        return [];
    }
}

export async function createDeal(data: z.infer<typeof dealSchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'create')) {
            throw new Error('Unauthorized');
        }

        const validated = dealSchema.parse(data);

        const deal = await prisma.$transaction(async (tx) => {
            const newDeal = await tx.deal.create({
                data: {
                    businessId: ctx.businessId,
                    ...validated,
                    companyId: validated.companyId || null,
                    clientId: validated.clientId || null,
                },
                include: {
                    company: { select: { id: true, name: true } },
                    client: { select: { id: true, name: true } }
                }
            });

            // Create audit log
            await logAudit({
                action: 'CREATE',
                entity: 'Deal',
                entityId: newDeal.title,
                module: 'crm',
                entityName: 'Deal',
                details: validated
            });

            return newDeal;
        }, {
            timeout: 15000
        });

        revalidatePath('/crm/pipeline');
        revalidatePath('/');
        return { success: true, deal: { ...deal, value: Number(deal.value) } };
    } catch (error: any) {
        console.error('Error creating deal:', error);
        return { success: false, error: error.message || 'Failed to create deal' };
    }
}

export async function updateDeal(id: string, data: Partial<z.infer<typeof dealSchema>>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'edit')) {
            throw new Error('Unauthorized');
        }

        const deal = await prisma.$transaction(async (tx) => {
            const updatedDeal = await tx.deal.update({
                where: { id, businessId: ctx.businessId },
                data: {
                    ...data,
                    ...(data.companyId !== undefined && { companyId: data.companyId || null }),
                    ...(data.clientId !== undefined && { clientId: data.clientId || null }),
                },
                include: {
                    company: { select: { id: true, name: true } },
                    client: { select: { id: true, name: true } }
                }
            });

            // Create audit log
            await logAudit({
                action: 'UPDATE',
                entity: 'Deal',
                entityId: updatedDeal.title,
                module: 'crm',
                entityName: 'Deal',
                details: data
            });

            return updatedDeal;
        }, {
            timeout: 15000
        });

        revalidatePath('/crm/pipeline');
        revalidatePath('/');
        return { success: true, deal: { ...deal, value: Number(deal.value) } };
    } catch (error) {
        console.error('Error updating deal:', error);
        return { success: false, error: 'Failed to update deal' };
    }
}

// Optimized action for drag-and-drop
export async function updateDealStage(id: string, stage: DealStage) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'edit')) {
            throw new Error('Unauthorized');
        }

        const deal = await prisma.$transaction(async (tx) => {
            const updatedDeal = await tx.deal.update({
                where: { id, businessId: ctx.businessId },
                data: { stage },
                include: {
                    company: { select: { id: true, name: true } },
                    client: { select: { id: true, name: true } }
                }
            });

            // Create audit log
            await logAudit({
                action: 'UPDATE_STAGE',
                entity: 'Deal',
                entityId: updatedDeal.title,
                module: 'crm',
                entityName: 'Deal',
                details: { stage }
            });

            return updatedDeal;
        }, {
            timeout: 15000
        });

        revalidatePath('/crm/pipeline');
        revalidatePath('/');
        return { success: true, deal: { ...deal, value: Number(deal.value) } };
    } catch (error) {
        console.error('Error updating deal stage:', error);
        return { success: false, error: 'Failed to update deal stage' };
    }
}

export async function deleteDeal(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'delete')) {
            throw new Error('Unauthorized');
        }

        // Wrap in transaction for audit logging
        await prisma.$transaction(async (tx) => {
            const deal = await tx.deal.update({
                where: { id, businessId: ctx.businessId },
                data: { deletedAt: new Date() }
            });

            // Create audit log
            await logAudit({
                action: 'SOFT_DELETE',
                entity: 'Deal',
                entityId: deal.title,
                module: 'crm',
                entityName: 'Deal',
                details: { reason: 'User deleted deal' }
            });
        }, {
            timeout: 15000
        });

        revalidatePath('/crm/pipeline');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting deal:', error);
        return { success: false, error: 'Failed to delete deal' };
    }
}
export async function convertDealToOrder(dealId: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'sales', 'create')) {
            throw new Error('Unauthorized');
        }

        const deal = await prisma.deal.findFirst({
            where: { id: dealId, deletedAt: null, businessId: ctx.businessId },
            include: { company: true, client: true }
        });

        if (!deal) return { success: false, error: 'Deal not found' };
        if (!deal.clientId) return { success: false, error: 'Deal must have a linked Contact to create an order' };

        // Generate Order Number
        const { generateOrderNumber } = await import('../sales/utils');
        const orderNumber = await generateOrderNumber();

        // Create Order as Draft inside transaction
        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    businessId: ctx.businessId,
                    orderNumber,
                    clientId: deal.clientId!,
                    companyId: deal.companyId,
                    dealId: deal.id,
                    subTotal: deal.value,
                    grandTotal: deal.value,
                    status: 'draft',
                    notes: `Converted from Deal: ${deal.title}. Original Value: SAR ${deal.value}\n${deal.notes || ''}`
                }
            });

            // Create audit log
            await logAudit({
                action: 'CONVERT_TO_ORDER',
                entity: 'Deal',
                entityId: deal.title,
                module: 'crm',
                entityName: 'Deal',
                details: { orderId: newOrder.id }
            });

            return newOrder;
        }, {
            timeout: 15000
        });

        revalidatePath('/sales/orders');
        revalidatePath('/crm/pipeline');
        revalidatePath('/');

        return { success: true, orderId: order.id };
    } catch (error) {
        console.error('Error converting deal to order:', error);
        return { success: false, error: 'Failed to convert deal to order' };
    }
}
