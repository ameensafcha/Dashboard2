'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';

export async function createSupplier(data: { name: string, contactPerson?: string, email?: string, phone?: string, address?: string, notes?: string }) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'suppliers', 'create')) {
            throw new Error('Unauthorized');
        }

        if (!data.name) return { success: false, error: 'Name is required' };

        const supplier = await prisma.supplier.create({
            data: {
                businessId: ctx.businessId,
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
