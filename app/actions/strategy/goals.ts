'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidateTag, unstable_cache } from 'next/cache';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';
import { ObjectiveStatus, StrategyType, Prisma } from '@prisma/client';

const goalSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    type: z.nativeEnum(StrategyType).default(StrategyType.ANNUAL_PLAN),
    status: z.nativeEnum(ObjectiveStatus).default(ObjectiveStatus.ON_TRACK),
    targetValue: z.number().optional().nullable(),
    currentValue: z.number().default(0),
    unit: z.string().optional().nullable(),
    endDate: z.date().optional().nullable(),
});

export async function getGoalsOverview(businessSlug?: string) {
    const ctx = await getBusinessContext(businessSlug);
    if (!hasPermission(ctx, 'crm', 'view')) throw new Error('Unauthorized'); // Using CRM as generic perm fallback

    const cacheKey = [`goals-overview-${ctx.businessId}`];

    return unstable_cache(
        async () => {
            try {
                const objectives = await prisma.objective.findMany({
                    where: { strategy: { businessId: ctx.businessId } },
                    select: { status: true }
                });

                const total = objectives.length;
                const onTrack = objectives.filter(o => o.status === 'ON_TRACK').length;
                const atRisk = objectives.filter(o => o.status === 'AT_RISK').length;
                const achieved = objectives.filter(o => o.status === 'COMPLETED').length;

                return { total, onTrack, atRisk, achieved };
            } catch (error) {
                console.error('Error fetching goals overview:', error);
                return { total: 0, onTrack: 0, atRisk: 0, achieved: 0 };
            }
        },
        cacheKey,
        { tags: [`goals-${ctx.businessId}`], revalidate: 3600 }
    )();
}

export async function getGoals(businessSlug?: string, type?: string, status?: string) {
    const ctx = await getBusinessContext(businessSlug);
    if (!hasPermission(ctx, 'crm', 'view')) throw new Error('Unauthorized');

    const cacheKey = [`goals-${ctx.businessId}`, type || 'ALL', status || 'ALL'];

    return unstable_cache(
        async () => {
            try {
                const whereClause: any = { strategy: { businessId: ctx.businessId } };

                if (type && type !== 'ALL') whereClause.strategy = { ...whereClause.strategy, type: type as StrategyType };
                if (status && status !== 'ALL') whereClause.status = status as ObjectiveStatus;

                const objectives = await prisma.objective.findMany({
                    where: whereClause,
                    include: {
                        strategy: true,
                        keyResults: true
                    },
                    orderBy: [
                        { dueDate: 'asc' },
                        { createdAt: 'desc' }
                    ],
                });

                const mappedGoals = objectives.map(obj => {
                    const kr = obj.keyResults[0];
                    return {
                        id: obj.id,
                        title: obj.title,
                        description: obj.description,
                        type: obj.strategy.type,
                        status: obj.status,
                        targetValue: kr ? Number(kr.targetValue) : null,
                        currentValue: kr ? Number(kr.currentValue) : Number(obj.progress),
                        unit: kr ? kr.unit : '%',
                        endDate: obj.dueDate,
                        createdAt: obj.createdAt,
                    };
                });

                return serializeValues(mappedGoals);
            } catch (error) {
                console.error('Error fetching goals:', error);
                return [];
            }
        },
        cacheKey,
        { tags: [`goals-${ctx.businessId}`], revalidate: 3600 }
    )();
}

export async function createGoal(data: z.input<typeof goalSchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'create')) throw new Error('Unauthorized');

        const parsed = goalSchema.safeParse(data);
        if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

        const validData = parsed.data;

        const goal = await prisma.$transaction(async (tx) => {
            let strategy = await tx.strategy.findFirst({
                where: { businessId: ctx.businessId, year: new Date().getFullYear(), type: validData.type }
            });
            if (!strategy) {
                strategy = await tx.strategy.create({
                    data: { businessId: ctx.businessId, title: `${new Date().getFullYear()} ${validData.type.replace('_', ' ')}`, year: new Date().getFullYear(), type: validData.type }
                });
            }

            const newObjective = await tx.objective.create({
                data: {
                    strategyId: strategy.id,
                    title: validData.title,
                    description: validData.description,
                    owner: ctx.userId,
                    dueDate: validData.endDate,
                    status: validData.status,
                    progress: validData.targetValue && validData.targetValue > 0 ? (validData.currentValue / validData.targetValue) * 100 : validData.currentValue,
                }
            });

            if (validData.targetValue) {
                await tx.keyResult.create({
                    data: {
                        objectiveId: newObjective.id,
                        title: 'Primary Metric',
                        targetValue: validData.targetValue ? new Prisma.Decimal(validData.targetValue) : null,
                        currentValue: validData.currentValue ? new Prisma.Decimal(validData.currentValue) : new Prisma.Decimal(0),
                        unit: validData.unit || 'units',
                    }
                });
            }

            await logAudit({
                action: 'CREATE',
                entity: 'Objective',
                entityId: newObjective.id,
                module: 'strategy',
                entityName: newObjective.title,
                details: validData,
                tx,
                userId: ctx.userId,
                businessId: ctx.businessId
            });

            return {
                id: newObjective.id,
                title: newObjective.title,
                description: newObjective.description,
                type: strategy.type,
                status: newObjective.status,
                targetValue: validData.targetValue,
                currentValue: validData.currentValue,
                unit: validData.unit || '%',
                endDate: newObjective.dueDate,
                createdAt: newObjective.createdAt,
            };
        }, { timeout: 15000 });

        revalidateTag(`goals-${ctx.businessId}`, { expire: 0 });
        return { success: true, data: serializeValues(goal) };
    } catch (error) {
        console.error('Error creating goal:', error);
        return { success: false, error: 'Failed to create goal' };
    }
}

export async function updateGoal(id: string, data: Partial<z.input<typeof goalSchema>>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'edit')) throw new Error('Unauthorized');

        const parsed = goalSchema.partial().safeParse(data);
        if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
        const validData = parsed.data;

        const goal = await prisma.$transaction(async (tx) => {
            const objective = await tx.objective.findUnique({
                where: { id },
                include: { strategy: true, keyResults: true }
            });

            if (!objective || objective.strategy.businessId !== ctx.businessId) throw new Error('Not found');

            const kr = objective.keyResults[0];
            let progress = objective.progress;

            if (kr) {
                const newCurrent = validData.currentValue !== undefined ? validData.currentValue : Number(kr.currentValue);
                const newTarget = validData.targetValue !== undefined ? validData.targetValue : Number(kr.targetValue);
                if (newTarget && newTarget > 0) progress = new Prisma.Decimal((newCurrent / newTarget) * 100);

                const krUpdate: Prisma.KeyResultUpdateInput = {};
                if (validData.currentValue !== undefined) krUpdate.currentValue = new Prisma.Decimal(validData.currentValue);
                if (validData.targetValue !== undefined) krUpdate.targetValue = validData.targetValue ? new Prisma.Decimal(validData.targetValue) : null;
                if (validData.unit !== undefined) krUpdate.unit = validData.unit || '';

                await tx.keyResult.update({
                    where: { id: kr.id },
                    data: krUpdate
                });
            } else if (validData.targetValue) {
                await tx.keyResult.create({
                    data: {
                        objectiveId: objective.id,
                        title: 'Primary Metric',
                        targetValue: new Prisma.Decimal(validData.targetValue),
                        currentValue: new Prisma.Decimal(validData.currentValue || 0),
                        unit: validData.unit || 'units',
                    }
                });
                if (validData.targetValue > 0) progress = new Prisma.Decimal(((validData.currentValue || 0) / validData.targetValue) * 100);
            }

            const updated = await tx.objective.update({
                where: { id },
                data: {
                    title: validData.title,
                    description: validData.description,
                    status: validData.status,
                    dueDate: validData.endDate,
                    progress: progress
                }
            });

            await logAudit({
                action: 'UPDATE',
                entity: 'Objective',
                entityId: id,
                module: 'strategy',
                entityName: updated.title,
                details: validData,
                tx,
                userId: ctx.userId,
                businessId: ctx.businessId
            });
            return updated;
        }, { timeout: 15000 });

        revalidateTag(`goal-${id}`, { expire: 0 });
        revalidateTag(`goals-${ctx.businessId}`, { expire: 0 });
        return { success: true, data: serializeValues(goal) };
    } catch (error) {
        console.error('Error updating goal:', error);
        return { success: false, error: 'Failed to update goal' };
    }
}

export async function deleteGoal(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'delete')) throw new Error('Unauthorized');

        await prisma.$transaction(async (tx) => {
            const obj = await tx.objective.findUnique({ where: { id }, include: { strategy: true } });
            if (obj && obj.strategy.businessId === ctx.businessId) {
                await tx.objective.delete({ where: { id } });
                await logAudit({
                    action: 'DELETE',
                    entity: 'Objective',
                    entityId: id,
                    module: 'strategy',
                    entityName: 'Goal',
                    details: { reason: 'User deleted goal' },
                    tx,
                    userId: ctx.userId,
                    businessId: ctx.businessId
                });
            }
        }, { timeout: 15000 });

        revalidateTag(`goal-${id}`, { expire: 0 });
        revalidateTag(`goals-${ctx.businessId}`, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('Error deleting goal:', error);
        return { success: false, error: 'Failed to delete goal' };
    }
}
