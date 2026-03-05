'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidateTag, unstable_cache } from 'next/cache';
import { CampaignChannel, CampaignStatus } from '@prisma/client';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';
import { generateCampaignId } from './utils';

const campaignSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    channel: z.nativeEnum(CampaignChannel),
    status: z.nativeEnum(CampaignStatus).default(CampaignStatus.DRAFT),
    budget: z.number().min(0, 'Budget must be >= 0'),
    startDate: z.date(),
    endDate: z.date().optional().nullable(),
    notes: z.string().optional(),
});

const updateCampaignMetricsSchema = z.object({
    reach: z.number().min(0).optional(),
    clicks: z.number().min(0).optional(),
    leads: z.number().min(0).optional(),
    conversions: z.number().min(0).optional(),
    spent: z.number().min(0).optional(),
    revenue: z.number().min(0).optional(),
    status: z.nativeEnum(CampaignStatus).optional(),
});

export async function getCampaigns(businessSlug?: string, search?: string, status?: string, channel?: string) {
    const ctx = await getBusinessContext(businessSlug);
    if (!hasPermission(ctx, 'marketing', 'view')) {
        throw new Error('Unauthorized');
    }

    const cacheKey = [`campaigns-${ctx.businessId}`, search || '', status || '', channel || ''];

    return unstable_cache(
        async () => {
            try {
                const whereClause: any = { deletedAt: null, businessId: ctx.businessId };

                if (search) {
                    whereClause.name = { contains: search, mode: 'insensitive' };
                }

                if (status && status !== 'ALL') {
                    whereClause.status = status as CampaignStatus;
                }

                if (channel && channel !== 'ALL') {
                    whereClause.channel = channel as CampaignChannel;
                }

                const campaigns = await prisma.campaign.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                });

                return serializeValues(campaigns);
            } catch (error) {
                console.error('Error fetching campaigns:', error);
                return [];
            }
        },
        cacheKey,
        {
            tags: [`campaigns-${ctx.businessId}`, `marketing-overview-${ctx.businessId}`],
            revalidate: 3600
        }
    )();
}

export async function getMarketingOverview(businessSlug?: string) {
    const ctx = await getBusinessContext(businessSlug);
    if (!hasPermission(ctx, 'marketing', 'view')) {
        throw new Error('Unauthorized');
    }

    return unstable_cache(
        async () => {
            try {
                const campaigns = await prisma.campaign.findMany({
                    where: { deletedAt: null, businessId: ctx.businessId, status: { in: ['ACTIVE', 'COMPLETED'] } },
                    select: { budget: true, spent: true, leads: true, revenue: true }
                });

                const totalBudget = campaigns.reduce((acc, curr) => acc + Number(curr.budget || 0), 0);
                const totalSpent = campaigns.reduce((acc, curr) => acc + Number(curr.spent || 0), 0);
                const totalLeads = campaigns.reduce((acc, curr) => acc + (curr.leads || 0), 0);
                const totalRevenue = campaigns.reduce((acc, curr) => acc + Number(curr.revenue || 0), 0);

                const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

                return serializeValues({
                    totalBudget,
                    totalSpent,
                    totalLeads,
                    roi
                });
            } catch (error) {
                console.error('Error fetching marketing overview:', error);
                return {
                    totalBudget: 0,
                    totalSpent: 0,
                    totalLeads: 0,
                    roi: 0
                };
            }
        },
        [`marketing-overview-${ctx.businessId}`],
        {
            tags: [`marketing-overview-${ctx.businessId}`],
            revalidate: 3600
        }
    )();
}

export async function createCampaign(data: z.infer<typeof campaignSchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'marketing', 'create')) {
            throw new Error('Unauthorized');
        }

        const parsed = campaignSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }

        const validData = parsed.data;

        const campaign = await prisma.$transaction(async (tx) => {
            const campaignId = await generateCampaignId();
            const newCampaign = await tx.campaign.create({
                data: {
                    businessId: ctx.businessId,
                    campaignId,
                    name: validData.name,
                    channel: validData.channel,
                    status: validData.status,
                    budget: validData.budget,
                    startDate: validData.startDate,
                    endDate: validData.endDate || null,
                    notes: validData.notes || null,
                }
            });

            await logAudit({
                action: 'CREATE',
                entity: 'Campaign',
                entityId: campaignId,
                module: 'marketing',
                entityName: 'Campaign',
                details: validData
            });

            return newCampaign;
        });

        revalidateTag(`campaigns-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`marketing-overview-${ctx.businessId}`, { expire: 0 });

        return { success: true, data: serializeValues(campaign) };
    } catch (error) {
        console.error('Error creating campaign:', error);
        return { success: false, error: 'Failed to create campaign' };
    }
}

export async function updateCampaign(id: string, data: z.infer<typeof campaignSchema> & z.infer<typeof updateCampaignMetricsSchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'marketing', 'edit')) {
            throw new Error('Unauthorized');
        }

        const campaign = await prisma.$transaction(async (tx) => {
            const updateData: any = {};
            if (data.name !== undefined) updateData.name = data.name;
            if (data.channel !== undefined) updateData.channel = data.channel;
            if (data.status !== undefined) updateData.status = data.status;
            if (data.budget !== undefined) updateData.budget = data.budget;
            if (data.startDate !== undefined) updateData.startDate = data.startDate;
            if (data.endDate !== undefined) updateData.endDate = data.endDate;
            if (data.notes !== undefined) updateData.notes = data.notes;

            // Metrics
            if (data.reach !== undefined) updateData.reach = data.reach;
            if (data.clicks !== undefined) updateData.clicks = data.clicks;
            if (data.leads !== undefined) updateData.leads = data.leads;
            if (data.conversions !== undefined) updateData.conversions = data.conversions;
            if (data.spent !== undefined) updateData.spent = data.spent;
            if (data.revenue !== undefined) updateData.revenue = data.revenue;

            const updatedCampaign = await tx.campaign.update({
                where: { id, businessId: ctx.businessId },
                data: updateData
            });

            await logAudit({
                action: 'UPDATE',
                entity: 'Campaign',
                entityId: updatedCampaign.campaignId,
                module: 'marketing',
                entityName: 'Campaign',
                details: data
            });

            return updatedCampaign;
        });

        revalidateTag(`campaigns-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`marketing-overview-${ctx.businessId}`, { expire: 0 });

        return { success: true, data: serializeValues(campaign) };
    } catch (error) {
        console.error('Error updating campaign:', error);
        return { success: false, error: 'Failed to update campaign' };
    }
}

export async function deleteCampaign(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'marketing', 'delete')) {
            throw new Error('Unauthorized');
        }

        await prisma.$transaction(async (tx) => {
            const campaign = await tx.campaign.update({
                where: { id, businessId: ctx.businessId },
                data: { deletedAt: new Date() }
            });

            await logAudit({
                action: 'SOFT_DELETE',
                entity: 'Campaign',
                entityId: campaign.campaignId,
                module: 'marketing',
                entityName: 'Campaign',
                details: { reason: 'User deleted campaign' }
            });
        });

        revalidateTag(`campaigns-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`marketing-overview-${ctx.businessId}`, { expire: 0 });

        return { success: true };
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return { success: false, error: 'Failed to delete campaign' };
    }
}
