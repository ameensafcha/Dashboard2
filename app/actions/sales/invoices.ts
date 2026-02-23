'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createInvoice(data: {
    orderId: string;
    totalAmount: number;
    dueDate: Date;
}) {
    try {
        // Generate a simple Invoice Number
        const currentYear = new Date().getFullYear();
        const prefix = `INV-${currentYear}-`;

        const lastInvoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: { startsWith: prefix } },
            orderBy: { invoiceNumber: 'desc' }
        });

        const nextCounter = lastInvoice
            ? parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10) + 1
            : 1;

        const invoiceNumber = `${prefix}${nextCounter.toString().padStart(4, '0')}`;

        // Create the invoice
        const invoice = await prisma.invoice.create({
            data: {
                orderId: data.orderId,
                invoiceNumber,
                dueDate: data.dueDate,
                totalAmount: data.totalAmount,
                status: 'sent', // Mark as sent immediately as they just generated the PDF
            }
        });

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
