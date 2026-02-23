'use server';

import { PrismaClient, Product, Category, Prisma, ProductStatus, SfdaStatus } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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
    const { page = 1, limit = 5, search = '', status = '' } = params;

    const where: Prisma.ProductWhereInput = {};

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
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });
  return product ? serializeProduct(product) : null;
}

async function generateSKU(): Promise<string> {
  try {
    const lastProduct = await prisma.product.findFirst({
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
  const parsedData = productSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error(parsedData.error.issues[0].message);
  }
  const validData = parsedData.data;

  const skuPrefix = validData.skuPrefix || await generateSKU();

  const product = await prisma.product.create({
    data: {
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
  revalidatePath('/products');
  revalidatePath('/products/catalog');

  return serializeProduct(product);
}

export async function updateProduct(id: string, data: Partial<Product> & { categoryId?: string | null }) {
  const parsedData = productSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error(parsedData.error.issues[0].message);
  }
  const validData = parsedData.data;

  const product = await prisma.product.update({
    where: { id },
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

  revalidatePath('/products');
  revalidatePath('/products/catalog');

  return serializeProduct(product);
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath('/products');
  revalidatePath('/products/catalog');
}

export async function getCategories(search?: string) {
  const whereClause = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};

  return prisma.category.findMany({
    where: whereClause,
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(data: { name: string; description?: string | null }) {
  const category = await prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });

  revalidatePath('/products');
  revalidatePath('/products/catalog');

  return category;
}

export async function updateCategory(id: string, data: { name?: string; description?: string | null }) {
  const category = await prisma.category.update({
    where: { id },
    data,
  });

  revalidatePath('/products');
  revalidatePath('/products/catalog');

  return category;
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath('/products');
  revalidatePath('/products/catalog');
}

// Variants have been removed.
