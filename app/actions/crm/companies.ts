'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { toSafeNumber } from '@/lib/decimal';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';

const companySchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    industry: z.string().optional(),
    city: z.string().optional(),
    website: z.preprocess(
        (val) => {
            if (typeof val !== 'string') return val;
            const trimmed = val.trim();
            if (!trimmed) return '';
            return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        },
        z.string().url('Invalid URL').optional().or(z.literal(''))
    ),
    pricingTiers: z.array(z.object({
        categoryId: z.string(),
        pricingTierId: z.string()
    })).optional()
});

const getCachedCompanies = (businessId: string, search?: string) => unstable_cache(
    async () => {
        try {
            const companies = await prisma.company.findMany({
                where: {
                    deletedAt: null,
                    businessId: businessId,
                    ...(search ? {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { industry: { contains: search, mode: 'insensitive' } },
                            { city: { contains: search, mode: 'insensitive' } },
                        ]
                    } : {})
                },
                include: {
                    companyPricingTiers: {
                        include: {
                            category: true,
                            pricingTier: true
                        }
                    },
                    _count: {
                        select: { contacts: true, deals: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 200,
            });

            return serializeValues(companies);
        } catch (error) {
            console.error('Error fetching companies:', error);
            return [];
        }
    },
    [`companies-${businessId}`, search || ''],
    {
        tags: [`companies-${businessId}`],
        revalidate: 3600
    }
);

export async function getCompanies(businessSlug?: string, search?: string) {
    const ctx = await getBusinessContext(businessSlug);
    if (!hasPermission(ctx, 'crm', 'view')) {
        throw new Error('Unauthorized');
    }

    return getCachedCompanies(ctx.businessId, search)();
}

export async function createCompany(data: z.infer<typeof companySchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'create')) {
            throw new Error('Unauthorized');
        }

        const parsed = companySchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }

        const validData = parsed.data;

        const company = await prisma.$transaction(async (tx) => {
            const newCompany = await tx.company.create({
                data: {
                    businessId: ctx.businessId,
                    name: validData.name,
                    industry: validData.industry || null,
                    city: validData.city || null,
                    website: validData.website || null,
                    companyPricingTiers: validData.pricingTiers && validData.pricingTiers.length > 0 ? {
                        create: validData.pricingTiers.map(t => ({
                            businessId: ctx.businessId,
                            categoryId: t.categoryId,
                            pricingTierId: t.pricingTierId
                        }))
                    } : undefined
                }
            });

            // Create audit log
            await logAudit({
                action: 'CREATE',
                entity: 'Company',
                entityId: newCompany.name,
                module: 'crm',
                entityName: 'Company',
                details: validData
            });

            return newCompany;
        }, {
            timeout: 15000
        });

        revalidateTag(`companies-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`crm-overview-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-feed-${ctx.businessId}`, { expire: 0 });
        return { success: true, data: { ...company, lifetimeValue: company.lifetimeValue.toNumber() } };
    } catch (error) {
        console.error('Error creating company:', error);
        return { success: false, error: 'Failed to create company: ' + (error instanceof Error ? error.message : String(error)) };
    }
}

export async function updateCompany(id: string, data: z.infer<typeof companySchema>) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'edit')) {
            throw new Error('Unauthorized');
        }

        const parsed = companySchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }

        const validData = parsed.data;

        // P6: Wrap in transaction for atomicity (deleteMany + create)
        const company = await prisma.$transaction(async (tx) => {
            const updatedCompany = await tx.company.update({
                where: { id, businessId: ctx.businessId },
                data: {
                    name: validData.name,
                    industry: validData.industry || null,
                    city: validData.city || null,
                    website: validData.website || null,
                    companyPricingTiers: {
                        deleteMany: {},
                        create: validData.pricingTiers?.map(t => ({
                            businessId: ctx.businessId,
                            categoryId: t.categoryId,
                            pricingTierId: t.pricingTierId
                        })) || []
                    }
                }
            });

            // Create audit log
            await logAudit({
                action: 'UPDATE',
                entity: 'Company',
                entityId: updatedCompany.name,
                module: 'crm',
                entityName: 'Company',
                details: validData
            });

            return updatedCompany;
        }, {
            timeout: 15000
        });

        revalidateTag(`companies-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`crm-overview-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-feed-${ctx.businessId}`, { expire: 0 });
        return { success: true, data: { ...company, lifetimeValue: company.lifetimeValue.toNumber() } };
    } catch (error) {
        console.error('Error updating company:', error);
        return { success: false, error: 'Failed to update company' };
    }
}

export async function deleteCompany(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'crm', 'delete')) {
            throw new Error('Unauthorized');
        }

        // Delete the company
        // Contacts and Deals have onDelete: SetNull setup in Prisma, so they won't block deletion
        // Wrap in transaction for audit logging
        await prisma.$transaction(async (tx) => {
            const company = await tx.company.update({
                where: { id, businessId: ctx.businessId },
                data: { deletedAt: new Date() }
            });

            // Create audit log
            await logAudit({
                action: 'SOFT_DELETE',
                entity: 'Company',
                entityId: company.name,
                module: 'crm',
                entityName: 'Company',
                details: { reason: 'User deleted company' }
            });
        }, {
            timeout: 15000
        });

        revalidateTag(`companies-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`crm-overview-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-feed-${ctx.businessId}`, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('Error deleting company:', error);
        return { success: false, error: 'Failed to delete company' };
    }
}
