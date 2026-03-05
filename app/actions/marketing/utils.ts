import prisma from '@/lib/prisma';
import { getBusinessContext } from '@/lib/getBusinessContext';

export async function generateCampaignId(): Promise<string> {
    const ctx = await getBusinessContext();
    const currentYear = new Date().getFullYear();
    const prefix = `CAM-${currentYear}-`;

    const lastCampaign = await prisma.campaign.findFirst({
        where: {
            campaignId: { startsWith: prefix },
            businessId: ctx.businessId,
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
