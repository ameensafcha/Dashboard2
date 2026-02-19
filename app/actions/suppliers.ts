'use server';

import prisma from '@/lib/prisma';

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
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

export async function createSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
  return await prisma.supplier.create({
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
}

export async function deleteSupplier(id: string): Promise<boolean> {
  try {
    await prisma.supplier.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return false;
  }
}
