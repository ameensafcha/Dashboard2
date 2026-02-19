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

export async function getProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
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
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function createProduct(data: any) {
  return prisma.product.create({
    data: {
      name: data.name,
      skuPrefix: data.skuPrefix,
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
}

export async function updateProduct(id: string, data: any) {
  return prisma.product.update({
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
