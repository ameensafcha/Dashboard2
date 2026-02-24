import prisma from './prisma';

export async function createAuditLog(
    tx: any,
    data: {
        action: string;
        entity: string;
        entityId: string;
        details?: any;
        userId?: string;
    }
) {
    // If no transaction is provided, use the global prisma client
    const client = tx || prisma;

    return client.auditLog.create({
        data: {
            ...data,
            details: data.details || {},
        }
    });
}
