import prisma from '@/lib/prisma'
import { getBusinessContext } from '@/lib/getBusinessContext'

export async function logAudit({
    action,
    entity,
    entityId,
    details,
    module,
    entityName,
    description,
    tx,
    userId,
    businessId
}: {
    action: string
    entity: string
    entityId: string
    details?: any
    module?: string
    entityName?: string
    description?: string
    tx?: any
    userId?: string
    businessId?: string
}) {
    try {
        let finalUserId = userId;
        let finalBusinessId = businessId;
        let finalUserName: string | undefined;

        if (!finalUserId || !finalBusinessId) {
            const ctx = await getBusinessContext();
            finalUserId = ctx.userId;
            finalBusinessId = ctx.businessId;
            finalUserName = ctx.userName;
        }

        const db = tx || prisma;

        await db.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                details: details || {},
                userId: finalUserId,
                userName: finalUserName || 'System',
                businessId: finalBusinessId,
                module,
                entityName,
                description
            }
        });
    } catch (error) {
        console.error('Failed to log audit:', error)
    }
}
