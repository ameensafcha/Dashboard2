'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
    return await prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

export async function createSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
  const result = await prisma.supplier.create({
    data: {
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
  revalidatePath('/');
  return result;
}

export async function updateSupplier(id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt'>>) {
  try {
    await prisma.supplier.update({
      where: { id },
      data,
    });
    revalidatePath('/products/suppliers');
    revalidatePath('/inventory/raw-materials');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating supplier:', error);
    return { success: false, error: 'Failed to update supplier' };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    revalidatePath('/products/suppliers');
    revalidatePath('/inventory/raw-materials');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return { success: false, error: 'Failed to delete supplier' };
  }
}
