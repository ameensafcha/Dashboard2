'use server';

import prisma from '@/lib/prisma';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { unstable_cache } from 'next/cache';

const getCachedCrmOverview = (businessId: string) => unstable_cache(
    async () => {
        const businessWhere = { businessId, deletedAt: null };

        const [
            companiesCount,
            contactsCount,
            openDeals,
            recentDeals,
        ] = await Promise.all([
            prisma.company.count({ where: businessWhere }),
            prisma.client.count({ where: businessWhere }),
            prisma.deal.findMany({
                where: { stage: { notIn: ['closed_won', 'closed_lost'] }, ...businessWhere },
                select: { id: true, value: true, stage: true },
            }),
            prisma.deal.findMany({
                where: businessWhere,
                take: 10,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true, title: true, value: true, stage: true, updatedAt: true,
                    company: { select: { name: true } },
                    client: { select: { name: true } },
                },
            }),
        ]);

        const pipelineValue = openDeals.reduce((sum, d) => sum + Number(d.value), 0);

        const stageCounts: Record<string, number> = {};
        openDeals.forEach(d => {
            stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1;
        });
        const dealsByStage = Object.entries(stageCounts).map(([stage, count]) => ({ stage, count }));

        return {
            kpis: {
                companies: companiesCount,
                contacts: contactsCount,
                activeDeals: openDeals.length,
                pipelineValue: Math.round(pipelineValue * 100) / 100,
            },
            dealsByStage,
            recentDeals: recentDeals.map(d => ({
                ...d,
                value: Number(d.value),
                updatedAt: d.updatedAt.toISOString(),
            })),
        };
    },
    [`crm-overview-${businessId}`],
    { tags: [`crm-overview-${businessId}`, `deals-${businessId}`, `contacts-${businessId}`, `companies-${businessId}`], revalidate: 3600 }
);

export async function getCrmOverview() {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'view')) {
            throw new Error('Unauthorized');
        }
        return await getCachedCrmOverview(ctx.businessId)();
    } catch (error) {
        console.error('Error fetching CRM overview:', error);
        return {
            kpis: { companies: 0, contacts: 0, activeDeals: 0, pipelineValue: 0 },
            dealsByStage: [],
            recentDeals: [],
        };
    }
}
