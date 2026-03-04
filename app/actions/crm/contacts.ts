'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { ClientType, LeadSource } from '@prisma/client';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';

const contactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    companyId: z.string().optional().nullable(),
    role: z.string().optional(),
    type: z.nativeEnum(ClientType).default(ClientType.lead),
    source: z.nativeEnum(LeadSource).default(LeadSource.manual_import),
    tags: z.array(z.string()).optional(),
    city: z.string().optional(),
    notes: z.string().optional(),
});

export async function getContacts(search?: string, companyId?: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'view')) {
            throw new Error('Unauthorized');
        }

        const whereClause: any = { deletedAt: null, businessId: ctx.businessId };

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                {
                    company: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                }
            ];
        }

        if (companyId) {
            whereClause.companyId = companyId;
        }

        const contacts = await prisma.client.findMany({
            where: whereClause,
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        industry: true
                    }
                },
                _count: {
                    select: { deals: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });

        return serializeValues(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return [];
    }
}

export async function createContact(data: z.infer<typeof contactSchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'create')) {
            throw new Error('Unauthorized');
        }

        const parsed = contactSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }

        const validData = parsed.data;

        const contact = await prisma.$transaction(async (tx) => {
            const newContact = await tx.client.create({
                data: {
                    businessId: ctx.businessId,
                    name: validData.name,
                    email: validData.email || null,
                    phone: validData.phone || null,
                    companyId: validData.companyId || null,
                    role: validData.role || null,
                    type: validData.type,
                    source: validData.source,
                    tags: validData.tags ? validData.tags : [],
                    city: validData.city || null,
                    notes: validData.notes || null,
                },
                include: {
                    company: { select: { id: true, name: true, industry: true } }
                }
            });

            // Create audit log
            await logAudit({
                action: 'CREATE',
                entity: 'Client',
                entityId: newContact.name,
                module: 'crm',
                entityName: 'Contact',
                details: validData
            });

            return newContact;
        }, {
            timeout: 15000
        });

        revalidatePath('/crm/contacts');
        revalidatePath('/crm/companies'); // Count of contacts inside companies might effectively change
        revalidatePath('/crm/contacts');
        revalidatePath('/');

        // Revalidate dashboard cache
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });

        return { success: true, data: { ...contact, tags: Array.isArray(contact.tags) ? contact.tags : [] } };
    } catch (error) {
        console.error('Error creating contact:', error);
        return { success: false, error: 'Failed to create contact' };
    }
}

export async function updateContact(id: string, data: z.infer<typeof contactSchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'edit')) {
            throw new Error('Unauthorized');
        }

        const parsed = contactSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }

        const validData = parsed.data;

        const contact = await prisma.$transaction(async (tx) => {
            const updatedContact = await tx.client.update({
                where: { id, businessId: ctx.businessId },
                data: {
                    name: validData.name,
                    email: validData.email || null,
                    phone: validData.phone || null,
                    companyId: validData.companyId || null,
                    role: validData.role || null,
                    type: validData.type,
                    source: validData.source,
                    tags: validData.tags ? validData.tags : undefined,
                    city: validData.city || null,
                    notes: validData.notes || null,
                },
                include: {
                    company: { select: { id: true, name: true, industry: true } }
                }
            });

            // Create audit log
            await logAudit({
                action: 'UPDATE',
                entity: 'Client',
                entityId: updatedContact.name,
                module: 'crm',
                entityName: 'Contact',
                details: validData
            });

            return updatedContact;
        }, {
            timeout: 15000
        });

        revalidatePath('/crm/contacts');
        revalidatePath(`/crm/contacts/${id}`);
        revalidatePath('/crm/companies');
        revalidatePath('/crm/contacts');
        revalidatePath('/');

        // Revalidate dashboard cache
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });

        return { success: true, data: { ...contact, tags: Array.isArray(contact.tags) ? contact.tags : [] } };
    } catch (error) {
        console.error('Error updating contact:', error);
        return { success: false, error: 'Failed to update contact' };
    }
}

export async function deleteContact(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'delete')) {
            throw new Error('Unauthorized');
        }

        // Wrap in transaction for audit logging
        await prisma.$transaction(async (tx) => {
            const contact = await tx.client.update({
                where: { id, businessId: ctx.businessId },
                data: { deletedAt: new Date() }
            });

            // Create audit log
            await logAudit({
                action: 'SOFT_DELETE',
                entity: 'Client',
                entityId: contact.name,
                module: 'crm',
                entityName: 'Contact',
                details: { reason: 'User deleted contact' }
            });
        }, {
            timeout: 15000
        });

        revalidatePath('/crm/contacts');
        revalidatePath('/crm/companies');
        revalidatePath('/crm/contacts');
        revalidatePath('/');

        // Revalidate dashboard cache
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });

        return { success: true };
    } catch (error) {
        console.error('Error deleting contact:', error);
        return { success: false, error: 'Failed to delete contact' };
    }
}
