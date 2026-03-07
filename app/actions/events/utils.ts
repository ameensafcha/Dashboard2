import prisma from '@/lib/prisma';
import { getBusinessContext } from '@/lib/getBusinessContext';

export async function generateEventId(businessId: string, tx?: any): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `EVT-${currentYear}-`;

    const db = tx || prisma;

    const lastEvent = await db.event.findFirst({
        where: {
            eventId: { startsWith: prefix },
            businessId: businessId,
        },
        orderBy: {
            eventId: 'desc'
        }
    });

    if (!lastEvent) {
        return `${prefix}0001`;
    }

    const lastCounter = parseInt(lastEvent.eventId.replace(prefix, ''), 10);
    const nextCounter = lastCounter + 1;

    return `${prefix}${nextCounter.toString().padStart(4, '0')}`;
}
