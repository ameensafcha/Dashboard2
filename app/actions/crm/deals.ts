'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DealStage } from '@prisma/client';

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
        const deals = await prisma.deal.findMany({
            where: search ? {
                OR: [
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
                ]
            } : undefined,
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
        const validated = dealSchema.parse(data);

        const deal = await prisma.deal.create({
            data: {
                ...validated,
                // Ensure foreign keys are not empty strings
                companyId: validated.companyId || null,
                clientId: validated.clientId || null,
            },
            include: {
                company: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } }
            }
        });

        revalidatePath('/crm/pipeline');
        return { success: true, deal: { ...deal, value: Number(deal.value) } };
    } catch (error) {
        console.error('Error creating deal:', error);
        return { success: false, error: 'Failed to create deal' };
    }
}

export async function updateDeal(id: string, data: Partial<z.infer<typeof dealSchema>>) {
    try {
        const deal = await prisma.deal.update({
            where: { id },
            data: {
                ...data,
                // Ensure missing strings don't turn into empty strings if updated explicitly
                ...(data.companyId !== undefined && { companyId: data.companyId || null }),
                ...(data.clientId !== undefined && { clientId: data.clientId || null }),
            },
            include: {
                company: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } }
            }
        });

        revalidatePath('/crm/pipeline');
        return { success: true, deal: { ...deal, value: Number(deal.value) } };
    } catch (error) {
        console.error('Error updating deal:', error);
        return { success: false, error: 'Failed to update deal' };
    }
}

// Optimized action for drag-and-drop
export async function updateDealStage(id: string, stage: DealStage) {
    try {
        const deal = await prisma.deal.update({
            where: { id },
            data: { stage },
            include: {
                company: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } }
            }
        });

        revalidatePath('/crm/pipeline');
        return { success: true, deal: { ...deal, value: Number(deal.value) } };
    } catch (error) {
        console.error('Error updating deal stage:', error);
        return { success: false, error: 'Failed to update deal stage' };
    }
}

export async function deleteDeal(id: string) {
    try {
        await prisma.deal.delete({
            where: { id }
        });

        revalidatePath('/crm/pipeline');
        return { success: true };
    } catch (error) {
        console.error('Error deleting deal:', error);
        return { success: false, error: 'Failed to delete deal' };
    }
}
