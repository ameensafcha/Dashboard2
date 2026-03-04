import prisma from '@/lib/prisma'
import { getBusinessContext } from '@/lib/getBusinessContext'

export async function logAudit({
    action,
    entity,
    entityId,
    details,
    module,
    entityName,
    description
}: {
    action: string
    entity: string
    entityId: string
    details?: any
    module?: string
    entityName?: string
    description?: string
}) {
    try {
        const ctx = await getBusinessContext()

        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                details: details || {},
                userId: ctx.userId,
                userName: ctx.userName,
                businessId: ctx.businessId,
                module,
                entityName,
                description
            }
        })
    } catch (error) {
        console.error('Failed to log audit:', error)
    }
}
