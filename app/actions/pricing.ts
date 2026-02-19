'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PricingTier as PrismaPricingTier, Category } from '@prisma/client';

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
    const tiers = await prisma.pricingTier.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tiers.map(tier => ({
      ...tier,
      minOrderKg: tier.minOrderKg.toNumber(),
      maxOrderKg: tier.maxOrderKg ? tier.maxOrderKg.toNumber() : 0, // Handle existing nulls safely if any
      pricePerKg: tier.pricePerKg.toNumber(),
      discountPercent: tier.discountPercent.toNumber(),
      marginPercent: tier.marginPercent.toNumber(),
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
    await prisma.pricingTier.create({
      data: {
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
    return { success: true };
  } catch (error) {
    console.error('Error creating pricing tier:', error);
    return { success: false, error: 'Failed to create pricing tier' };
  }
}

export async function updatePricingTier(id: string, data: {
  tierName: string;
  minOrderKg: number;
  maxOrderKg: number;
  pricePerKg: number;
  discountPercent: number;
  marginPercent: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.pricingTier.update({
      where: { id },
      data: {
        tierName: data.tierName,
        minOrderKg: data.minOrderKg,
        maxOrderKg: data.maxOrderKg,
        pricePerKg: data.pricePerKg,
        discountPercent: data.discountPercent,
        marginPercent: data.marginPercent,
      },
    });

    revalidatePath('/products/pricing');
    return { success: true };
  } catch (error) {
    console.error('Error updating pricing tier:', error);
    return { success: false, error: 'Failed to update pricing tier' };
  }
}

export async function deletePricingTier(id: string): Promise<boolean> {
  try {
    await prisma.pricingTier.delete({
      where: { id },
    });
    revalidatePath('/products/pricing');
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
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
