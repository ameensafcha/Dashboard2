'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidateTag, unstable_cache } from 'next/cache';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';
import { DocumentCategory } from '@prisma/client';

const documentSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    category: z.nativeEnum(DocumentCategory).default(DocumentCategory.OTHER),
    fileUrl: z.string().url('Invalid File URL'),
    fileType: z.string().min(1, 'File type is required'),
    fileSize: z.number().int().min(0, 'File size must be positive'),
    relatedToEntity: z.string().optional(),
    relatedToId: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

export async function getDocuments(businessSlug?: string, search?: string, category?: string) {
    const ctx = await getBusinessContext(businessSlug);
    if (!hasPermission(ctx, 'documents', 'view')) { // assuming a general docs permission or using settings
        // We might fallback to 'settings' or 'reports' if a specific docs one doesn't exist yet, but let's assume 'documents' is standard or we use 'crm' as fallback.
        if (!hasPermission(ctx, 'crm', 'view')) throw new Error('Unauthorized');
    }

    const cacheKey = [`documents-${ctx.businessId}`, search || 'ALL', category || 'ALL'];

    return unstable_cache(
        async () => {
            try {
                const whereClause: any = { businessId: ctx.businessId, deletedAt: null };

                if (category && category !== 'ALL') whereClause.category = category as DocumentCategory;
                if (search) {
                    whereClause.OR = [
                        { title: { contains: search, mode: 'insensitive' } },
                        { tags: { has: search } }
                    ];
                }

                const documents = await prisma.document.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                });

                return serializeValues(documents.map(d => ({
                    ...d,
                    title: d.name,
                    fileUrl: d.filePath
                } as any)));
            } catch (error) {
                console.error('Error fetching documents:', error);
                return [];
            }
        },
        cacheKey,
        { tags: [`documents-${ctx.businessId}`], revalidate: 3600 }
    )();
}

export async function uploadDocument(data: z.infer<typeof documentSchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'documents', 'upload')) throw new Error('Unauthorized');

        const parsed = documentSchema.safeParse(data);
        if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

        const validData = parsed.data;

        const doc = await prisma.$transaction(async (tx) => {
            const docId = `DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

            const newDoc = await tx.document.create({
                data: {
                    businessId: ctx.businessId,
                    docId,
                    name: validData.title,
                    category: validData.category,
                    filePath: validData.fileUrl,
                    fileName: validData.title,
                    mimeType: validData.fileType,
                    fileSize: validData.fileSize,
                    tags: validData.tags || [],
                    uploadedById: ctx.userId,
                    uploadedByName: ctx.userName,
                }
            });

            await logAudit({
                action: 'CREATE',
                entity: 'Document',
                entityId: newDoc.id,
                module: 'documents',
                entityName: newDoc.name,
                details: validData,
                tx,
                userId: ctx.userId,
                businessId: ctx.businessId
            });
            return newDoc;
        }, { timeout: 15000 });

        revalidateTag(`documents-${ctx.businessId}`, { expire: 0 });
        return { success: true, data: serializeValues(doc) };
    } catch (error) {
        console.error('Error uploading document:', error);
        return { success: false, error: 'Failed to save document record' };
    }
}

export async function deleteDocument(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'delete')) throw new Error('Unauthorized');

        await prisma.$transaction(async (tx) => {
            const doc = await tx.document.update({
                where: { id, businessId: ctx.businessId },
                data: { deletedAt: new Date() }
            });
            await logAudit({
                action: 'SOFT_DELETE',
                entity: 'Document',
                entityId: id,
                module: 'documents',
                entityName: doc.name,
                details: { reason: 'User deleted document' },
                tx,
                userId: ctx.userId,
                businessId: ctx.businessId
            });
        }, { timeout: 15000 });

        revalidateTag(`document-${id}`, { expire: 0 });
        revalidateTag(`documents-${ctx.businessId}`, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return { success: false, error: 'Failed to delete document' };
    }
}
