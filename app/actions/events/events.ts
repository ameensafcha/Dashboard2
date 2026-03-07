'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidateTag, unstable_cache } from 'next/cache';
import { EventType, EventStatus } from '@prisma/client';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';
import { generateEventId } from './utils';

const eventSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.nativeEnum(EventType),
    status: z.nativeEnum(EventStatus).default(EventStatus.PLANNING),
    venue: z.string().optional(),
    city: z.string().optional(),
    country: z.string().default('SA'),
    startDate: z.date(),
    endDate: z.date().optional().nullable(),
    budget: z.number().min(0).optional().nullable(),
    actualCost: z.number().min(0).optional().nullable(),
    boothNumber: z.string().optional(),
    notes: z.string().optional(),
});

export async function getEvents(businessSlug?: string, search?: string, status?: string, type?: string) {
    const ctx = await getBusinessContext(businessSlug);
    if (!hasPermission(ctx, 'events', 'view')) {
        throw new Error('Unauthorized');
    }

    const cacheKey = [`events-${ctx.businessId}`, search || '', status || '', type || ''];

    return unstable_cache(
        async () => {
            try {
                const whereClause: any = { deletedAt: null, businessId: ctx.businessId };

                if (search) {
                    whereClause.OR = [
                        { name: { contains: search, mode: 'insensitive' } },
                        { venue: { contains: search, mode: 'insensitive' } },
                        { city: { contains: search, mode: 'insensitive' } }
                    ];
                }
                if (status && status !== 'ALL') whereClause.status = status as EventStatus;
                if (type && type !== 'ALL') whereClause.type = type as EventType;

                const events = await prisma.event.findMany({
                    where: whereClause,
                    include: {
                        _count: { select: { leads: true } }
                    },
                    orderBy: { startDate: 'asc' },
                });

                return serializeValues(events);
            } catch (error) {
                console.error('Error fetching events:', error);
                return [];
            }
        },
        cacheKey,
        { tags: [`events-${ctx.businessId}`, `events-overview-${ctx.businessId}`], revalidate: 3600 }
    )();
}

export async function getEventById(id: string, businessSlug?: string) {
    const ctx = await getBusinessContext(businessSlug);
    if (!hasPermission(ctx, 'events', 'view')) throw new Error('Unauthorized');

    return unstable_cache(
        async () => {
            const event = await prisma.event.findFirst({
                where: { id, businessId: ctx.businessId, deletedAt: null },
                include: {
                    leads: { orderBy: { capturedAt: 'desc' } },
                    inventory: { orderBy: { name: 'asc' } }
                }
            });
            return event ? serializeValues(event) : null;
        },
        [`event-${id}-${ctx.businessId}`],
        { tags: [`event-${id}`, `events-${ctx.businessId}`], revalidate: 3600 }
    )();
}

export async function getEventsOverview(businessSlug?: string) {
    const ctx = await getBusinessContext(businessSlug);
    if (!hasPermission(ctx, 'events', 'view')) throw new Error('Unauthorized');

    return unstable_cache(
        async () => {
            try {
                const totalEvents = await prisma.event.count({
                    where: { businessId: ctx.businessId, deletedAt: null }
                });

                const upcoming = await prisma.event.count({
                    where: { businessId: ctx.businessId, deletedAt: null, status: { in: ['PLANNING', 'CONFIRMED'] } }
                });

                const totalLeads = await prisma.eventLead.count({
                    where: { businessId: ctx.businessId }
                });

                const convertedLeads = await prisma.eventLead.count({
                    where: { businessId: ctx.businessId, converted: true }
                });

                const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

                return serializeValues({ totalEvents, upcoming, totalLeads, conversionRate });
            } catch (error) {
                console.error('Error fetching events overview:', error);
                return { totalEvents: 0, upcoming: 0, totalLeads: 0, conversionRate: 0 };
            }
        },
        [`events-overview-${ctx.businessId}`],
        { tags: [`events-overview-${ctx.businessId}`, `events-${ctx.businessId}`], revalidate: 3600 }
    )();
}

export async function createEvent(data: z.infer<typeof eventSchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'events', 'create')) throw new Error('Unauthorized');

        const parsed = eventSchema.safeParse(data);
        if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

        const validData = parsed.data;

        const event = await prisma.$transaction(async (tx) => {
            const eventId = await generateEventId(ctx.businessId, tx);
            const newEvent = await tx.event.create({
                data: {
                    businessId: ctx.businessId,
                    eventId,
                    ...validData,
                }
            });

            await logAudit({ action: 'CREATE', entity: 'Event', entityId: eventId, module: 'events', entityName: 'Event', details: validData });
            return newEvent;
        });

        revalidateTag(`events-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`events-overview-${ctx.businessId}`, { expire: 0 });
        return { success: true, data: serializeValues(event) };
    } catch (error) {
        console.error('Error creating event:', error);
        return { success: false, error: 'Failed to create event' };
    }
}

export async function updateEvent(id: string, data: Partial<z.infer<typeof eventSchema>>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'events', 'edit')) throw new Error('Unauthorized');

        const event = await prisma.$transaction(async (tx) => {
            const updated = await tx.event.update({
                where: { id, businessId: ctx.businessId },
                data
            });

            await logAudit({ action: 'UPDATE', entity: 'Event', entityId: updated.eventId, module: 'events', entityName: 'Event', details: data });
            return updated;
        });

        revalidateTag(`event-${id}`, { expire: 0 });
        revalidateTag(`events-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`events-overview-${ctx.businessId}`, { expire: 0 });
        return { success: true, data: serializeValues(event) };
    } catch (error) {
        console.error('Error updating event:', error);
        return { success: false, error: 'Failed to update event' };
    }
}

export async function deleteEvent(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'events', 'delete')) throw new Error('Unauthorized');

        await prisma.$transaction(async (tx) => {
            const ev = await tx.event.update({
                where: { id, businessId: ctx.businessId },
                data: { deletedAt: new Date() }
            });
            await logAudit({ action: 'SOFT_DELETE', entity: 'Event', entityId: ev.eventId, module: 'events', entityName: 'Event', details: { reason: 'User deleted event' } });
        });

        revalidateTag(`event-${id}`, { expire: 0 });
        revalidateTag(`events-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`events-overview-${ctx.businessId}`, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('Error deleting event:', error);
        return { success: false, error: 'Failed to delete event' };
    }
}
