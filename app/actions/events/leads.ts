'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';
import { createContact } from '../crm/contacts'; // Import generic CRM contact creation

const eventLeadSchema = z.object({
    eventId: z.string(),
    name: z.string().min(1, 'Name is required'),
    companyName: z.string().optional(),
    jobTitle: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    notes: z.string().optional(),
    rating: z.number().min(1).max(5).default(3),
});

export async function createEventLead(data: z.infer<typeof eventLeadSchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'events', 'edit')) throw new Error('Unauthorized');

        const parsed = eventLeadSchema.safeParse(data);
        if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

        const validData = parsed.data;

        // Verify Event belongs to business
        const event = await prisma.event.findFirst({
            where: { id: validData.eventId, businessId: ctx.businessId, deletedAt: null }
        });

        if (!event) return { success: false, error: 'Event not found' };

        const lead = await prisma.$transaction(async (tx) => {
            const newLead = await tx.eventLead.create({
                data: {
                    businessId: ctx.businessId,
                    eventId: validData.eventId,
                    name: validData.name,
                    company: validData.companyName,
                    email: validData.email,
                    phone: validData.phone,
                    notes: [validData.jobTitle, validData.notes].filter(Boolean).join(' | '),
                }
            });

            await logAudit({ action: 'CREATE', entity: 'EventLead', entityId: newLead.id, module: 'events', entityName: 'Event Lead', details: validData });
            return newLead;
        });

        revalidateTag(`event-${validData.eventId}`, { expire: 0 });
        revalidateTag(`events-overview-${ctx.businessId}`, { expire: 0 });
        return { success: true, data: serializeValues(lead) };
    } catch (error) {
        console.error('Error creating event lead:', error);
        return { success: false, error: 'Failed to create event lead' };
    }
}

export async function convertEventLeadToContact(leadId: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'create')) throw new Error('Unauthorized (CRM Create required)');

        const lead = await prisma.eventLead.findFirst({
            where: { id: leadId, businessId: ctx.businessId }
        });

        if (!lead) return { success: false, error: 'Lead not found' };
        if (lead.converted) return { success: false, error: 'Lead already converted' };

        // We convert by creating a CRM Contact and optionally a Company
        const result = await prisma.$transaction(async (tx) => {
            let companyId = undefined;

            // If lead has company name, try finding or creating company
            if (lead.company) {
                const existingCompany = await tx.company.findFirst({
                    where: { businessId: ctx.businessId, name: { equals: lead.company, mode: 'insensitive' }, deletedAt: null }
                });

                if (existingCompany) {
                    companyId = existingCompany.id;
                } else {
                    const newCompany = await tx.company.create({
                        data: {
                            businessId: ctx.businessId,
                            name: lead.company,
                        }
                    });
                    companyId = newCompany.id;
                }
            }

            // Create Client (Contact)
            const newContact = await tx.client.create({
                data: {
                    businessId: ctx.businessId,
                    name: lead.name,
                    email: lead.email || undefined,
                    phone: lead.phone || undefined,
                    companyId,
                    type: 'lead',
                    source: 'event',
                    notes: `Converted from Event Lead. ${lead.notes || ''}`
                }
            });

            // Mark Event Lead as converted
            const updatedLead = await tx.eventLead.update({
                where: { id: leadId },
                data: { converted: true, convertedClientId: newContact.id }
            });

            await logAudit({ action: 'UPDATE', entity: 'EventLead', entityId: leadId, module: 'events', entityName: 'Event Lead', details: { converted: true, contactId: newContact.id } });

            return newContact;
        });

        revalidateTag(`event-${lead.eventId}`, { expire: 0 });
        revalidateTag(`events-overview-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`crm-contacts-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`crm-companies-${ctx.businessId}`, { expire: 0 });

        return { success: true, data: serializeValues(result) };

    } catch (error) {
        console.error('Error converting lead:', error);
        return { success: false, error: 'Failed to convert lead' };
    }
}

export async function deleteEventLead(id: string, eventId: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'events', 'edit')) throw new Error('Unauthorized');

        await prisma.eventLead.delete({
            where: { id, businessId: ctx.businessId }
        });

        revalidateTag(`event-${eventId}`, { expire: 0 });
        revalidateTag(`events-overview-${ctx.businessId}`, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('Error deleting lead:', error);
        return { success: false, error: 'Failed to delete lead' };
    }
}
