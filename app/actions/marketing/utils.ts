import prisma from '@/lib/prisma';
import { getBusinessContext } from '@/lib/getBusinessContext';

export async function generateCampaignId(businessId: string, tx?: any): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `CAM-${currentYear}-`;

    const db = tx || prisma;

    const lastCampaign = await db.campaign.findFirst({
        where: {
            campaignId: { startsWith: prefix },
            businessId,
        },
        orderBy: {
            campaignId: 'desc'
        }
    });

    if (!lastCampaign) {
        return `${prefix}0001`;
    }

    const lastCounter = parseInt(lastCampaign.campaignId.replace(prefix, ''), 10);
    const nextCounter = lastCounter + 1;

    return `${prefix}${nextCounter.toString().padStart(4, '0')}`;
}
