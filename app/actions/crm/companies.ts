'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

export async function getCompanies(search?: string) {
    try {
        const companies = await prisma.company.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { industry: { contains: search, mode: 'insensitive' } },
                    { city: { contains: search, mode: 'insensitive' } },
                ]
            } : undefined,
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

        // Safely transform Decimal to primitive numbers for client components
        return companies.map((c: any) => ({
            ...c,
            lifetimeValue: c.lifetimeValue.toNumber(),
            pricingTiers: c.companyPricingTiers.map((t: any) => ({
                id: t.id,
                categoryId: t.categoryId,
                categoryName: t.category.name,
                pricingTierId: t.pricingTierId,
                tierName: t.pricingTier.tierName,
                pricePerKg: t.pricingTier.pricePerKg.toNumber(),
                minOrderKg: t.pricingTier.minOrderKg.toNumber(),
                marginPercent: t.pricingTier.marginPercent.toNumber()
            }))
        }));
    } catch (error) {
        console.error('Error fetching companies:', error);
        return [];
    }
}

export async function createCompany(data: z.infer<typeof companySchema>) {
    try {
        const parsed = companySchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }

        const validData = parsed.data;

        const company = await prisma.company.create({
            data: {
                name: validData.name,
                industry: validData.industry || null,
                city: validData.city || null,
                website: validData.website || null,
                companyPricingTiers: validData.pricingTiers && validData.pricingTiers.length > 0 ? {
                    create: validData.pricingTiers.map(t => ({
                        categoryId: t.categoryId,
                        pricingTierId: t.pricingTierId
                    }))
                } : undefined
            }
        });

        revalidatePath('/crm/companies');
        return { success: true, data: { ...company, lifetimeValue: company.lifetimeValue.toNumber() } };
    } catch (error) {
        console.error('Error creating company:', error);
        return { success: false, error: 'Failed to create company: ' + (error instanceof Error ? error.message : String(error)) };
    }
}

export async function updateCompany(id: string, data: z.infer<typeof companySchema>) {
    try {
        const parsed = companySchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }

        const validData = parsed.data;

        // P6: Wrap in transaction for atomicity (deleteMany + create)
        const company = await prisma.$transaction(async (tx) => {
            return tx.company.update({
                where: { id },
                data: {
                    name: validData.name,
                    industry: validData.industry || null,
                    city: validData.city || null,
                    website: validData.website || null,
                    companyPricingTiers: {
                        deleteMany: {},
                        create: validData.pricingTiers?.map(t => ({
                            categoryId: t.categoryId,
                            pricingTierId: t.pricingTierId
                        })) || []
                    }
                }
            });
        });

        revalidatePath('/crm/companies');
        revalidatePath(`/crm/companies/${id}`);
        return { success: true, data: { ...company, lifetimeValue: company.lifetimeValue.toNumber() } };
    } catch (error) {
        console.error('Error updating company:', error);
        return { success: false, error: 'Failed to update company' };
    }
}

export async function deleteCompany(id: string) {
    try {
        // Delete the company
        // Contacts and Deals have onDelete: SetNull setup in Prisma, so they won't block deletion
        await prisma.company.delete({
            where: { id }
        });

        revalidatePath('/crm/companies');
        return { success: true };
    } catch (error) {
        console.error('Error deleting company:', error);
        return { success: false, error: 'Failed to delete company' };
    }
}
