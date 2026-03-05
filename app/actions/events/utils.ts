import prisma from '@/lib/prisma';
import { getBusinessContext } from '@/lib/getBusinessContext';

export async function generateEventId(): Promise<string> {
    const ctx = await getBusinessContext();
    const currentYear = new Date().getFullYear();
    const prefix = `EVT-${currentYear}-`;

    const lastEvent = await prisma.event.findFirst({
        where: {
            eventId: { startsWith: prefix },
            businessId: ctx.businessId,
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
