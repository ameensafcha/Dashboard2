'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PricingTier as PrismaPricingTier, Category } from '@prisma/client';

export type PricingTierWithCategory = PrismaPricingTier & {
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
    return tiers;
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
  pricePerKg: number;
  discountPercent: number;
  marginPercent: number;
  isGlobal?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if category already has a tier (though schema unique constraint handles this, 
    // explicit check provides better error message)
    const existingTier = await prisma.pricingTier.findUnique({
      where: { categoryId: data.categoryId },
    });

    if (existingTier) {
      return { success: false, error: 'This category already has a pricing tier.' };
    }

    await prisma.pricingTier.create({
      data: {
        categoryId: data.categoryId,
        tierName: data.tierName,
        minOrderKg: data.minOrderKg,
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
