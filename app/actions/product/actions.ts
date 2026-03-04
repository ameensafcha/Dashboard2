'use server';

import { PrismaClient, Product, Category, Prisma, ProductStatus, SfdaStatus } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';

const prisma = new PrismaClient();

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

type SerializedProduct = Omit<Product, 'baseCost' | 'baseRetailPrice' | 'size'> & {
  baseCost: number;
  baseRetailPrice: number;
  size?: number | null;
  unit?: string | null;
  category?: Category | null;
};

export interface ProductsResponse {
  products: SerializedProduct[];
  total: number;
  page: number;
  totalPages: number;
}

function serializeProduct(product: Product & { category?: Category | null }): SerializedProduct {
  return {
    ...product,
    baseCost: Number(product.baseCost),
    baseRetailPrice: Number(product.baseRetailPrice),
    size: (product as any).size ? Number((product as any).size) : null,
    unit: (product as any).unit || null,
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

  revalidatePath('/products');
  revalidatePath('/products/catalog');
  revalidatePath('/');

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

  revalidatePath('/products');
  revalidatePath('/products/catalog');
  revalidatePath('/');

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

  revalidatePath('/products');
  revalidatePath('/products/catalog');
  revalidatePath('/');
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
  revalidatePath('/');

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
  revalidatePath('/');

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
  revalidatePath('/');
}

// Variants have been removed.
