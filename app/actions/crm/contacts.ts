'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ClientType, LeadSource } from '@prisma/client';

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

export async function getContacts(search?: string) {
    try {
        const contacts = await prisma.client.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    {
                        company: {
                            name: { contains: search, mode: 'insensitive' }
                        }
                    }
                ]
            } : undefined,
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
            orderBy: { createdAt: 'desc' }
        });

        // Prisma Json types might need safe parsing if they aren't guaranteed arrays
        return contacts.map(c => ({
            ...c,
            tags: Array.isArray(c.tags) ? c.tags : []
        }));
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return [];
    }
}

export async function createContact(data: z.infer<typeof contactSchema>) {
    try {
        const parsed = contactSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }

        const validData = parsed.data;

        const contact = await prisma.client.create({
            data: {
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

        revalidatePath('/crm/contacts');
        revalidatePath('/crm/companies'); // Count of contacts inside companies might effectively change
        return { success: true, data: { ...contact, tags: Array.isArray(contact.tags) ? contact.tags : [] } };
    } catch (error) {
        console.error('Error creating contact:', error);
        return { success: false, error: 'Failed to create contact' };
    }
}

export async function updateContact(id: string, data: z.infer<typeof contactSchema>) {
    try {
        const parsed = contactSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }

        const validData = parsed.data;

        const contact = await prisma.client.update({
            where: { id },
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

        revalidatePath('/crm/contacts');
        revalidatePath(`/crm/contacts/${id}`);
        revalidatePath('/crm/companies');
        return { success: true, data: { ...contact, tags: Array.isArray(contact.tags) ? contact.tags : [] } };
    } catch (error) {
        console.error('Error updating contact:', error);
        return { success: false, error: 'Failed to update contact' };
    }
}

export async function deleteContact(id: string) {
    try {
        await prisma.client.delete({
            where: { id }
        });

        revalidatePath('/crm/contacts');
        revalidatePath('/crm/companies');
        return { success: true };
    } catch (error) {
        console.error('Error deleting contact:', error);
        return { success: false, error: 'Failed to delete contact' };
    }
}
