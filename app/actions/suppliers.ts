'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
}

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'suppliers', 'view')) {
      throw new Error('Unauthorized');
    }

    return await prisma.supplier.findMany({
      where: { deletedAt: null, businessId: ctx.businessId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

export async function createSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
  const ctx = await getBusinessContext();
  if (!hasPermission(ctx, 'suppliers', 'create')) {
    throw new Error('Unauthorized');
  }

  const result = await prisma.supplier.create({
    data: {
      businessId: ctx.businessId,
      name: data.name,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      isActive: data.isActive ?? true,
    },
  });
  revalidatePath('/products/suppliers');
  revalidatePath('/inventory/raw-materials');
  revalidatePath('/suppliers');
  return result;
}

export async function updateSupplier(id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt'>>) {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'suppliers', 'edit')) {
      throw new Error('Unauthorized');
    }

    await prisma.supplier.update({
      where: { id, businessId: ctx.businessId },
      data,
    });
    revalidatePath('/products/suppliers');
    revalidatePath('/inventory/raw-materials');
    revalidatePath('/suppliers');
    return { success: true };
  } catch (error) {
    console.error('Error updating supplier:', error);
    return { success: false, error: 'Failed to update supplier' };
  }
}

export async function deleteSupplier(id: string) {
  try {
    const ctx = await getBusinessContext();
    if (!hasPermission(ctx, 'suppliers', 'delete')) {
      throw new Error('Unauthorized');
    }

    await prisma.supplier.update({
      where: { id, businessId: ctx.businessId },
      data: { deletedAt: new Date() }
    });
    revalidatePath('/products/suppliers');
    revalidatePath('/inventory/raw-materials');
    revalidatePath('/suppliers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return { success: false, error: 'Failed to delete supplier' };
  }
}
