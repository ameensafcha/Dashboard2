'use server';

import prisma from '@/lib/prisma';

export async function getCrmOverview() {
    try {
        const [
            companiesCount,
            contactsCount,
            openDeals,
            recentDeals,
        ] = await Promise.all([
            prisma.company.count(),
            prisma.client.count(),
            prisma.deal.findMany({
                where: { stage: { notIn: ['closed_won', 'closed_lost'] } },
                select: { id: true, value: true, stage: true },
            }),
            prisma.deal.findMany({
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

        // Deals by stage count
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
    } catch (error) {
        console.error('Error fetching CRM overview:', error);
        return {
            kpis: { companies: 0, contacts: 0, activeDeals: 0, pipelineValue: 0 },
            dealsByStage: [],
            recentDeals: [],
        };
    }
}
