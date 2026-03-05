'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';

export const eventInventorySchema = z.object({
    eventId: z.string(),
    name: z.string().min(1, 'Name is required'),
    quantity: z.number().min(1).default(1),
    status: z.enum(['PREPARING', 'SHIPPED', 'AT_VENUE', 'RETURNED']).default('PREPARING'),
    notes: z.string().optional(),
});

export async function createEventInventoryItem(data: z.infer<typeof eventInventorySchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'events', 'edit')) throw new Error('Unauthorized');

        const parsed = eventInventorySchema.safeParse(data);
        if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

        const validData = parsed.data;

        const item = await prisma.eventInventoryItem.create({
            data: {
                businessId: ctx.businessId,
                ...validData,
            }
        });

        revalidateTag(`event-${validData.eventId}`, { expire: 0 });
        return { success: true, data: serializeValues(item) };
    } catch (error) {
        console.error('Error creating inventory item:', error);
        return { success: false, error: 'Failed to create item' };
    }
}

export async function updateEventInventoryItemStatus(id: string, eventId: string, status: 'PREPARING' | 'SHIPPED' | 'AT_VENUE' | 'RETURNED') {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'events', 'edit')) throw new Error('Unauthorized');

        await prisma.eventInventoryItem.update({
            where: { id, businessId: ctx.businessId },
            data: { status }
        });

        revalidateTag(`event-${eventId}`, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('Error updating status:', error);
        return { success: false, error: 'Failed to update status' };
    }
}

export async function deleteEventInventoryItem(id: string, eventId: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'events', 'edit')) throw new Error('Unauthorized');

        await prisma.eventInventoryItem.delete({
            where: { id, businessId: ctx.businessId }
        });

        revalidateTag(`event-${eventId}`, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('Error deleting item:', error);
        return { success: false, error: 'Failed to delete item' };
    }
}
