import prisma from '@/lib/prisma';
import { getBusinessContext } from '@/lib/getBusinessContext';

export async function generateOrderNumber(): Promise<string> {
    const ctx = await getBusinessContext();
    const currentYear = new Date().getFullYear();
    const prefix = `ORD-${currentYear}-`;

    const lastOrder = await prisma.order.findFirst({
        where: {
            orderNumber: { startsWith: prefix },
            businessId: ctx.businessId,
        },
        orderBy: {
            orderNumber: 'desc'
        }
    });

    if (!lastOrder) {
        return `${prefix}0001`;
    }

    const lastCounter = parseInt(lastOrder.orderNumber.replace(prefix, ''), 10);
    const nextCounter = lastCounter + 1;

    return `${prefix}${nextCounter.toString().padStart(4, '0')}`;
}
