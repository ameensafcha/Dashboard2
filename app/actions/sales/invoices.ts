'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';

export async function createInvoice(data: {
    orderId: string;
    totalAmount: number;
    dueDate: Date;
}) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'finance', 'create')) { // or specific invoice permission
            throw new Error('Unauthorized');
        }

        // Verify order belongs to business
        const order = await prisma.order.findUnique({
            where: { id: data.orderId, businessId: ctx.businessId }
        })
        if (!order) throw new Error('Order not found');

        // Generate a simple Invoice Number
        const currentYear = new Date().getFullYear();
        const prefix = `INV-${currentYear}-`;

        const lastInvoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: { startsWith: prefix }, businessId: ctx.businessId },
            orderBy: { invoiceNumber: 'desc' }
        });

        const nextCounter = lastInvoice
            ? parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10) + 1
            : 1;

        const invoiceNumber = `${prefix}${nextCounter.toString().padStart(4, '0')}`;

        const invoice = await prisma.$transaction(async (tx) => {
            // Create the invoice
            const newInvoice = await tx.invoice.create({
                data: {
                    businessId: ctx.businessId,
                    orderId: data.orderId,
                    invoiceNumber,
                    dueDate: data.dueDate,
                    totalAmount: data.totalAmount,
                    status: 'sent', // Mark as sent immediately as they just generated the PDF
                }
            });

            await logAudit({
                action: 'CREATE',
                entity: 'Invoice',
                entityId: invoiceNumber,
                module: 'finance',
                entityName: 'Invoice',
                details: { orderId: data.orderId, total: data.totalAmount }
            })

            return newInvoice;
        }, {
            timeout: 15000
        })

        // Invoicing no longer triggers status changes. 
        // Status is managed via updateOrderStatus action.

        revalidatePath('/sales/orders');
        return {
            success: true,
            invoice: {
                ...invoice,
                totalAmount: Number(invoice.totalAmount.toString()),
            }
        };

    } catch (error) {
        console.error('Failed to create invoice:', error);
        return { success: false, error: 'Failed to generate invoice record.' };
    }
}
