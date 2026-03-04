'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PricingTier as PrismaPricingTier, Category } from '@prisma/client';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';

export type PricingTierWithCategory = Omit<PrismaPricingTier, 'minOrderKg' | 'maxOrderKg' | 'pricePerKg' | 'discountPercent' | 'marginPercent'> & {
  minOrderKg: number;
  maxOrderKg: number;
  pricePerKg: number;
  discountPercent: number;
  marginPercent: number;
  category: Category | null;
};

// Fetch all pricing tiers with their associated category
export async function getPricingTiers(): Promise<PricingTierWithCategory[]> {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'pricing', 'view')) {
      throw new Error('Unauthorized');
    }

    const tiers = await prisma.pricingTier.findMany({
      where: {
        deletedAt: null,
        businessId: ctx.businessId
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tiers.map(tier => ({
      id: tier.id,
      productId: tier.productId,
      tierName: tier.tierName,
      minOrderKg: tier.minOrderKg.toNumber(),
      maxOrderKg: tier.maxOrderKg ? tier.maxOrderKg.toNumber() : 0,
      pricePerKg: tier.pricePerKg.toNumber(),
      discountPercent: tier.discountPercent.toNumber(),
      marginPercent: tier.marginPercent.toNumber(),
      isGlobal: tier.isGlobal,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
      categoryId: tier.categoryId,
      category: tier.category,
      deletedAt: tier.deletedAt,
      businessId: tier.businessId,
    }));
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    return [];
  }
}

// Create a new pricing tier linked to a category
// Enforces 1 tier per category via schema constraints
export async function createPricingTier(data: {
  categoryId: string;
  tierName: string;
  minOrderKg: number;
  maxOrderKg: number;
  pricePerKg: number;
  discountPercent: number;
  marginPercent: number;
  isGlobal?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'pricing', 'create')) {
      throw new Error('Unauthorized');
    }

    await prisma.pricingTier.create({
      data: {
        businessId: ctx.businessId,
        categoryId: data.categoryId,
        tierName: data.tierName,
        minOrderKg: data.minOrderKg,
        maxOrderKg: data.maxOrderKg,
        pricePerKg: data.pricePerKg,
        discountPercent: data.discountPercent,
        marginPercent: data.marginPercent,
        isGlobal: data.isGlobal || false,
      },
    });

    revalidatePath('/products/pricing');
    revalidatePath('/products/catalog');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error creating pricing tier:', error);
    return { success: false, error: 'Failed to create pricing tier' };
  }
}

export async function updatePricingTier(id: string, data: {
  categoryId: string;
  tierName: string;
  minOrderKg: number;
  maxOrderKg: number;
  pricePerKg: number;
  discountPercent: number;
  marginPercent: number;
  isGlobal?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'pricing', 'edit')) {
      throw new Error('Unauthorized');
    }

    await prisma.pricingTier.update({
      where: { id, businessId: ctx.businessId },
      data: {
        categoryId: data.categoryId,
        tierName: data.tierName,
        minOrderKg: data.minOrderKg,
        maxOrderKg: data.maxOrderKg,
        pricePerKg: data.pricePerKg,
        discountPercent: data.discountPercent,
        marginPercent: data.marginPercent,
        isGlobal: data.isGlobal ?? false,
      },
    });

    revalidatePath('/products/pricing');
    revalidatePath('/products/catalog');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating pricing tier:', error);
    return { success: false, error: 'Failed to update pricing tier' };
  }
}

export async function deletePricingTier(id: string): Promise<boolean> {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'pricing', 'delete')) {
      throw new Error('Unauthorized');
    }

    await prisma.pricingTier.update({
      where: { id, businessId: ctx.businessId },
      data: { deletedAt: new Date() },
    });
    revalidatePath('/products/pricing');
    revalidatePath('/products/catalog');
    revalidatePath('/');
    return true;
  } catch (error) {
    console.error('Error deleting pricing tier:', error);
    return false;
  }
}

// Fetch categories for the dropdown
export async function getCategoriesForPricing(): Promise<Category[]> {
  try {
    // Return all categories (or filter those without tiers if we want to restrict selection)
    // To restrict: 
    // const categories = await prisma.category.findMany({ where: { pricingTier: null } });
    // But since schema has relation, we can filter in JS or query

    // For now, return all, UI can disable used ones if needed
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'pricing', 'view')) {
      return [];
    }

    const categories = await prisma.category.findMany({
      where: { deletedAt: null, businessId: ctx.businessId },
      orderBy: { name: 'asc' },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
