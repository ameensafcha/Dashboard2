'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createSupplier(data: { name: string, contactPerson?: string, email?: string, phone?: string, address?: string, notes?: string }) {
    try {
        if (!data.name) return { success: false, error: 'Name is required' };

        const supplier = await prisma.supplier.create({
            data: {
                name: data.name,
                contactPerson: data.contactPerson,
                email: data.email,
                phone: data.phone,
                address: data.address,
                notes: data.notes
            }
        });

        revalidatePath('/products/suppliers');
        revalidatePath('/inventory/raw-materials'); // Refresh raw materials where supplier is selectable
        return { success: true, id: supplier.id };
    } catch (e) {
        return { success: false, error: 'Failed to create supplier' };
    }
}
