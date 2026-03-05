'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidateTag, unstable_cache } from 'next/cache';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
    priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
    dueDate: z.date().optional().nullable(),
    assignedToId: z.string().optional().nullable(),
    relatedToEntity: z.string().optional(),
    relatedToId: z.string().optional(),
});

export async function getTasks(businessSlug?: string, assigneeId?: string, status?: string) {
    const ctx = await getBusinessContext(businessSlug);
    if (!hasPermission(ctx, 'crm', 'view')) {
        throw new Error('Unauthorized'); // Tasks will use CRM permissions for now, or we can add a specific tasks permission later
    }

    const cacheKey = [`tasks-${ctx.businessId}`, assigneeId || 'ALL', status || 'ALL'];

    return unstable_cache(
        async () => {
            try {
                const whereClause: any = { businessId: ctx.businessId, deletedAt: null };

                if (assigneeId && assigneeId !== 'ALL') whereClause.assignedToId = assigneeId;
                if (status && status !== 'ALL') whereClause.status = status as TaskStatus;

                const tasks = await prisma.task.findMany({
                    where: whereClause,
                    include: {
                        assignedTo: { select: { id: true, name: true, email: true } },
                        createdBy: { select: { id: true, name: true } },
                        _count: { select: { comments: true } }
                    },
                    orderBy: [
                        { priority: 'desc' },
                        { dueDate: 'asc' },
                        { createdAt: 'desc' }
                    ],
                });

                return serializeValues(tasks);
            } catch (error) {
                console.error('Error fetching tasks:', error);
                return [];
            }
        },
        cacheKey,
        { tags: [`tasks-${ctx.businessId}`], revalidate: 3600 }
    )();
}

export async function createTask(data: z.infer<typeof taskSchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'tasks', 'create')) throw new Error('Unauthorized');



        const parsed = taskSchema.safeParse(data);
        if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

        const validData = parsed.data;

        const task = await prisma.$transaction(async (tx) => {
            const taskId = `TSK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

            const newTask = await tx.task.create({
                data: {
                    businessId: ctx.businessId,
                    taskId,
                    createdById: ctx.userId,
                    createdByName: ctx.userName,
                    title: validData.title,
                    description: validData.description,
                    status: validData.status,
                    priority: validData.priority,
                    dueDate: validData.dueDate,
                    assigneeId: validData.assignedToId,
                    referenceId: validData.relatedToId,
                }
            });

            await logAudit({
                action: 'CREATE',
                entity: 'Task',
                entityId: newTask.id,
                module: 'tasks',
                entityName: 'Task',
                details: validData,
                tx,
                userId: ctx.userId,
                businessId: ctx.businessId
            });
            return newTask;
        }, { timeout: 15000 });

        revalidateTag(`tasks-${ctx.businessId}`, { expire: 0 });
        return { success: true, data: serializeValues(task) };
    } catch (error) {
        console.error('Error creating task:', error);
        return { success: false, error: 'Failed to create task' };
    }
}

export async function updateTask(id: string, data: Partial<z.infer<typeof taskSchema>>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'edit')) throw new Error('Unauthorized');

        const task = await prisma.$transaction(async (tx) => {
            const updated = await tx.task.update({
                where: { id, businessId: ctx.businessId },
                data
            });

            await logAudit({
                action: 'UPDATE',
                entity: 'Task',
                entityId: id,
                module: 'tasks',
                entityName: 'Task',
                details: data,
                tx,
                userId: ctx.userId,
                businessId: ctx.businessId
            });
            return updated;
        }, { timeout: 15000 });

        revalidateTag(`task-${id}`, { expire: 0 });
        revalidateTag(`tasks-${ctx.businessId}`, { expire: 0 });
        return { success: true, data: serializeValues(task) };
    } catch (error) {
        console.error('Error updating task:', error);
        return { success: false, error: 'Failed to update task' };
    }
}

export async function deleteTask(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'delete')) throw new Error('Unauthorized');

        await prisma.$transaction(async (tx) => {
            await tx.task.update({
                where: { id, businessId: ctx.businessId },
                data: { deletedAt: new Date() }
            });
            await logAudit({
                action: 'SOFT_DELETE',
                entity: 'Task',
                entityId: id,
                module: 'tasks',
                entityName: 'Task',
                details: { reason: 'User deleted task' },
                tx,
                userId: ctx.userId,
                businessId: ctx.businessId
            });
        }, { timeout: 15000 });

        revalidateTag(`task-${id}`, { expire: 0 });
        revalidateTag(`tasks-${ctx.businessId}`, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('Error deleting task:', error);
        return { success: false, error: 'Failed to delete task' };
    }
}
