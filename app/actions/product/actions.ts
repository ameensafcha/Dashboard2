'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ProductsResponse {
  products: any[];
  total: number;
  page: number;
  totalPages: number;
}

function serializeProduct(product: any) {
  return {
    ...product,
    baseCost: Number(product.baseCost),
    baseRetailPrice: Number(product.baseRetailPrice),
  };
}

export async function getProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
  try {
    const { page = 1, limit = 5, search = '', status = '' } = params;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { skuPrefix: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);
    
    return {
      products: products?.map(serializeProduct) || [],
      total: total || 0,
      page,
      totalPages: Math.ceil((total || 0) / limit),
    };
  } catch (error: any) {
    console.error('Error fetching products:', error?.message || error);
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
    include: { category: true },
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
  } catch (error: any) {
    console.error('Error generating SKU:', error?.message || error);
    const timestamp = Date.now().toString().slice(-4);
    return `SKU-${timestamp}`;
  }
}

export async function createProduct(data: any) {
  const skuPrefix = data.skuPrefix || await generateSKU();
  
  const product = await prisma.product.create({
    data: {
      name: data.name,
      skuPrefix: skuPrefix,
      categoryId: data.categoryId || null,
      description: data.description,
      keyIngredients: data.keyIngredients,
      caffeineFree: data.caffeineFree ?? true,
      sfdaStatus: data.sfdaStatus || 'not_submitted',
      sfdaReference: data.sfdaReference,
      baseCost: data.baseCost,
      baseRetailPrice: data.baseRetailPrice,
      image: data.image,
      status: data.status || 'active',
      launchDate: data.launchDate,
    },
  });
  return serializeProduct(product);
}

export async function updateProduct(id: string, data: any) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      skuPrefix: data.skuPrefix,
      categoryId: data.categoryId || null,
      description: data.description,
      keyIngredients: data.keyIngredients,
      caffeineFree: data.caffeineFree,
      sfdaStatus: data.sfdaStatus,
      sfdaReference: data.sfdaReference,
      baseCost: data.baseCost,
      baseRetailPrice: data.baseRetailPrice,
      image: data.image,
      status: data.status,
      launchDate: data.launchDate,
    },
  });
  return serializeProduct(product);
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(data: { name: string; description?: string | null }) {
  return prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
}

export async function updateCategory(id: string, data: { name?: string; description?: string | null }) {
  return prisma.category.update({
    where: { id },
    data,
  });
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
}
