'use server';

import { PrismaClient, Product, Category, Prisma, ProductStatus, SfdaStatus } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';

import prisma from '@/lib/prisma';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  skuPrefix: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  keyIngredients: z.string().nullable().optional(),
  caffeineFree: z.boolean().optional(),
  sfdaStatus: z.nativeEnum(SfdaStatus).optional(),
  sfdaReference: z.string().nullable().optional(),
  baseCost: z.number().nonnegative('Cost cannot be negative').nullable().optional(),
  baseRetailPrice: z.number().nonnegative('Price cannot be negative').nullable().optional(),
  size: z.number().positive('Size must be positive').nullable().optional(),
  unit: z.string().optional(),
  laborCost: z.number().nonnegative().optional(),
  packagingCost: z.number().nonnegative().optional(),
  overheadCost: z.number().nonnegative().optional(),
  image: z.string().nullable().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  launchDate: z.coerce.date().nullable().optional(),
});

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

type SerializedProduct = Omit<Product, 'baseCost' | 'baseRetailPrice' | 'size' | 'laborCost' | 'packagingCost' | 'overheadCost'> & {
  baseCost: number;
  baseRetailPrice: number;
  size?: number | null;
  unit?: string | null;
  laborCost: number;
  packagingCost: number;
  overheadCost: number;
  totalCOGS: number;
  marginPercent: number;
  category?: Category | null;
};

export interface ProductsResponse {
  products: SerializedProduct[];
  total: number;
  page: number;
  totalPages: number;
}

function serializeProduct(product: any): SerializedProduct {
  let materialCost = 0;
  if (product.recipeItems) {
    for (const item of product.recipeItems) {
      materialCost += Number(item.quantity) * Number(item.rawMaterial?.unitCost || 0);
    }
  }

  const laborCost = Number(product.laborCost || 0);
  const packagingCost = Number(product.packagingCost || 0);
  const overheadCost = Number(product.overheadCost || 0);
  const totalCOGS = materialCost + laborCost + packagingCost + overheadCost;

  const baseRetailPrice = Number(product.baseRetailPrice || 0);
  let marginPercent = 0;
  if (baseRetailPrice > 0) {
    marginPercent = ((baseRetailPrice - totalCOGS) / baseRetailPrice) * 100;
  } else if (totalCOGS === 0) {
    marginPercent = 100;
  }

  // Remove recipeItems from the serialized payload to avoid clutter if not needed,
  // but we can just pass the rest of the product object unchanged.
  const { recipeItems, ...restProduct } = product;

  return {
    ...restProduct,
    baseCost: Number(product.baseCost),
    baseRetailPrice,
    size: product.size ? Number(product.size) : null,
    unit: product.unit || null,
    laborCost,
    packagingCost,
    overheadCost,
    totalCOGS,
    marginPercent,
  };
}

export async function getProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'products', 'view')) {
      throw new Error('Unauthorized');
    }

    const { page = 1, limit = 5, search = '', status = '' } = params;

    const where: Prisma.ProductWhereInput = { deletedAt: null, businessId: ctx.businessId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { skuPrefix: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as Prisma.EnumProductStatusFilter;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          recipeItems: { include: { rawMaterial: true } }
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products?.map(serializeProduct) || [],
      total: total || 0,
      page,
      totalPages: Math.ceil((total || 0) / limit),
    };
  } catch (error: unknown) {
    console.error('Error fetching products:', error instanceof Error ? error.message : String(error));
    return {
      products: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
  }
}

export async function getProduct(id: string) {
  const ctx = await getBusinessContext();
  if (!hasPermission(ctx, 'products', 'view')) return null;

  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null, businessId: ctx.businessId },
    include: {
      category: true,
      recipeItems: { include: { rawMaterial: true } }
    },
  });
  return product ? serializeProduct(product) : null;
}

async function generateSKU(businessId: string): Promise<string> {
  try {
    const lastProduct = await prisma.product.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    let nextNum = 1;
    if (lastProduct && lastProduct.skuPrefix) {
      const match = lastProduct.skuPrefix.match(/SKU-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }

    return `SKU-${nextNum}`;
  } catch (error: unknown) {
    console.error('Error generating SKU:', error instanceof Error ? error.message : String(error));
    const timestamp = Date.now().toString().slice(-4);
    return `SKU-${timestamp}`;
  }
}

export async function createProduct(data: Partial<Product> & { categoryId?: string | null }) {
  const ctx = await getBusinessContext();
  if (!hasPermission(ctx, 'products', 'create')) {
    throw new Error('Unauthorized');
  }

  const parsedData = productSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error(parsedData.error.issues[0].message);
  }
  const validData = parsedData.data;

  const skuPrefix = validData.skuPrefix || await generateSKU(ctx.businessId);

  const product = await prisma.product.create({
    data: {
      businessId: ctx.businessId,
      name: validData.name || 'Unnamed Product',
      skuPrefix: skuPrefix,
      categoryId: validData.categoryId || null,
      description: validData.description,
      keyIngredients: validData.keyIngredients,
      caffeineFree: validData.caffeineFree ?? true,
      sfdaStatus: validData.sfdaStatus || 'not_submitted',
      sfdaReference: validData.sfdaReference,
      baseCost: validData.baseCost || 0,
      baseRetailPrice: validData.baseRetailPrice || 0,
      size: validData.size || null,
      unit: validData.unit || 'gm',
      laborCost: validData.laborCost || 0,
      packagingCost: validData.packagingCost || 0,
      overheadCost: validData.overheadCost || 0,
      image: validData.image,
      status: validData.status || 'active',
      launchDate: validData.launchDate,
    },
  });

  await logAudit({
    action: 'CREATE',
    entity: 'Product',
    entityId: product.skuPrefix || product.id,
    module: 'products',
    entityName: 'Finished Product',
    details: validData
  })

  revalidateTag(`products-overview-${ctx.businessId}`, { expire: 0 });
  revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
  revalidatePath('/products');
  revalidatePath('/products/catalog');
  revalidatePath('/inventory/finished');

  return serializeProduct(product);
}

export async function updateProduct(id: string, data: Partial<Product> & { categoryId?: string | null }) {
  const ctx = await getBusinessContext();
  if (!hasPermission(ctx, 'products', 'edit')) {
    throw new Error('Unauthorized');
  }

  const parsedData = productSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error(parsedData.error.issues[0].message);
  }
  const validData = parsedData.data;

  const product = await prisma.product.update({
    where: { id, businessId: ctx.businessId },
    data: {
      name: validData.name,
      skuPrefix: validData.skuPrefix,
      categoryId: validData.categoryId || null,
      description: validData.description,
      keyIngredients: validData.keyIngredients,
      caffeineFree: validData.caffeineFree,
      sfdaStatus: validData.sfdaStatus,
      sfdaReference: validData.sfdaReference,
      baseCost: validData.baseCost ?? undefined,
      baseRetailPrice: validData.baseRetailPrice ?? undefined,
      size: validData.size,
      unit: validData.unit,
      laborCost: validData.laborCost ?? undefined,
      packagingCost: validData.packagingCost ?? undefined,
      overheadCost: validData.overheadCost ?? undefined,
      image: validData.image,
      status: validData.status,
      launchDate: validData.launchDate,
    },
  });

  await logAudit({
    action: 'UPDATE',
    entity: 'Product',
    entityId: product.skuPrefix || product.id,
    module: 'products',
    entityName: 'Finished Product',
    details: validData
  })

  revalidateTag(`products-overview-${ctx.businessId}`, { expire: 0 });
  revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
  revalidatePath('/products');
  revalidatePath('/products/catalog');
  revalidatePath('/inventory/finished');

  return serializeProduct(product);
}

export async function deleteProduct(id: string) {
  const ctx = await getBusinessContext();
  if (!hasPermission(ctx, 'products', 'delete')) {
    throw new Error('Unauthorized');
  }

  const prod = await prisma.product.findFirst({ where: { id, deletedAt: null, businessId: ctx.businessId } });
  if (!prod) throw new Error('Not found')

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await logAudit({
    action: 'SOFT_DELETE',
    entity: 'Product',
    entityId: prod.skuPrefix || prod.id,
    module: 'products',
    entityName: 'Finished Product',
  })

  revalidateTag(`products-overview-${ctx.businessId}`, { expire: 0 });
  revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
  revalidatePath('/products');
  revalidatePath('/products/catalog');
  revalidatePath('/inventory/finished');
}

export async function getCategories(search?: string) {
  const ctx = await getBusinessContext();
  if (!hasPermission(ctx, 'products', 'view')) {
    return [];
  }

  const whereClause: any = { deletedAt: null, businessId: ctx.businessId };
  if (search) {
    whereClause.name = { contains: search, mode: 'insensitive' as const };
  }

  return prisma.category.findMany({
    where: whereClause,
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(data: { name: string; description?: string | null }) {
  const ctx = await getBusinessContext();
  if (!hasPermission(ctx, 'products', 'create')) { // We don't have separate module for category
    throw new Error('Unauthorized');
  }

  const category = await prisma.category.create({
    data: {
      businessId: ctx.businessId,
      name: data.name,
      description: data.description,
    },
  });

  revalidatePath('/products');
  revalidatePath('/products/catalog');

  return category;
}

export async function updateCategory(id: string, data: { name?: string; description?: string | null }) {
  const ctx = await getBusinessContext();
  if (!hasPermission(ctx, 'products', 'edit')) {
    throw new Error('Unauthorized');
  }

  const category = await prisma.category.update({
    where: { id, businessId: ctx.businessId },
    data,
  });

  revalidatePath('/products');
  revalidatePath('/products/catalog');

  return category;
}

export async function deleteCategory(id: string) {
  const ctx = await getBusinessContext();
  if (!hasPermission(ctx, 'products', 'delete')) {
    throw new Error('Unauthorized');
  }

  const cat = await prisma.category.findUnique({ where: { id, businessId: ctx.businessId } });
  if (!cat) throw new Error('Category not found');

  await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
  revalidatePath('/products');
  revalidatePath('/products/catalog');
}

// Variants have been removed.

// ==========================================
// Phase 16: Production Costs (COGS) & Recipe
// ==========================================

export async function getProductRecipe(productId: string) {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'products', 'view')) {
      throw new Error('Unauthorized');
    }

    const recipeItems = await prisma.productRecipeItem.findMany({
      where: { productId, businessId: ctx.businessId },
      include: {
        rawMaterial: true
      }
    });

    return recipeItems.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      rawMaterial: {
        ...item.rawMaterial,
        currentStock: Number(item.rawMaterial.currentStock),
        unitCost: Number(item.rawMaterial.unitCost),
        reorderThreshold: item.rawMaterial.reorderThreshold ? Number(item.rawMaterial.reorderThreshold) : null,
        reorderQuantity: item.rawMaterial.reorderQuantity ? Number(item.rawMaterial.reorderQuantity) : null,
      }
    }));
  } catch (error) {
    console.error('Error fetching product recipe:', error);
    return [];
  }
}

export async function saveProductRecipe(productId: string, items: { rawMaterialId: string, quantity: number }[]) {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'products', 'edit')) {
      throw new Error('Unauthorized');
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing recipe items
      await tx.productRecipeItem.deleteMany({
        where: { productId, businessId: ctx.businessId }
      });

      // Insert new recipe items
      for (const item of items) {
        await tx.productRecipeItem.create({
          data: {
            businessId: ctx.businessId,
            productId,
            rawMaterialId: item.rawMaterialId,
            quantity: item.quantity
          }
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'ProductRecipe',
          entityId: productId,
          module: 'products',
          entityName: 'Product BOM',
          details: { itemCount: items.length },
          userId: ctx.userId,
          businessId: ctx.businessId,
          userName: ctx.userName,
          description: `Updated Recipe for Product`
        }
      });
    });

    revalidatePath('/products');
    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving product recipe:', error);
    return { success: false, error: error.message };
  }
}

export async function getProductCOGS(productId: string) {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'products', 'view')) {
      return { totalCOGS: 0, materialCost: 0, laborCost: 0, packagingCost: 0, overheadCost: 0 };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId, businessId: ctx.businessId },
      include: {
        recipeItems: {
          include: { rawMaterial: true }
        }
      }
    });

    if (!product) {
      return { totalCOGS: 0, materialCost: 0, laborCost: 0, packagingCost: 0, overheadCost: 0 };
    }

    // Calculate Raw Material Cost
    let materialCost = 0;
    for (const item of product.recipeItems) {
      materialCost += Number(item.quantity) * Number(item.rawMaterial.unitCost);
    }

    const laborCost = Number(product.laborCost || 0);
    const packagingCost = Number(product.packagingCost || 0);
    const overheadCost = Number(product.overheadCost || 0);

    const totalCOGS = materialCost + laborCost + packagingCost + overheadCost;

    return {
      totalCOGS,
      materialCost,
      laborCost,
      packagingCost,
      overheadCost
    };
  } catch (error) {
    console.error('Error calculating Product COGS:', error);
    return { totalCOGS: 0, materialCost: 0, laborCost: 0, packagingCost: 0, overheadCost: 0 };
  }
}
