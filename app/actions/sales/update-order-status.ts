'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
    draft: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],  // terminal
    cancelled: [],  // terminal
};

const updateStatusSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    newStatus: z.nativeEnum(OrderStatus),
});

export async function getValidNextStatuses(currentStatus: string): Promise<string[]> {
    return VALID_TRANSITIONS[currentStatus] || [];
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    // Validate inputs
    const parsed = updateStatusSchema.safeParse({ orderId, newStatus });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        // 1. Fetch order with items and their linked finished products
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        product: {
                            include: {
                                finishedProduct: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) return { success: false, error: 'Order not found.' };

        const currentStatus = order.status;

        // 2. Validate transition
        const validNext = VALID_TRANSITIONS[currentStatus] || [];
        if (!validNext.includes(newStatus)) {
            return { success: false, error: `Cannot move from "${currentStatus}" to "${newStatus}".` };
        }

        // 3. Execute transaction with side-effects
        await prisma.$transaction(async (tx) => {
            // --- CONFIRM: Reserve stock ---
            if (newStatus === 'confirmed') {
                for (const item of order.orderItems) {
                    const fp = item.product.finishedProduct;
                    if (fp) {
                        await tx.finishedProduct.update({
                            where: { id: fp.id },
                            data: { reservedStock: { increment: item.quantity } },
                        });
                    }
                }
            }

            // --- SHIP: Deduct stock + create movement logs ---
            if (newStatus === 'shipped') {
                // P3: Validate stock availability before deducting
                for (const item of order.orderItems) {
                    const fp = item.product.finishedProduct;
                    if (fp && Number(fp.currentStock) < item.quantity) {
                        throw new Error(`Insufficient stock for product. Available: ${Number(fp.currentStock)}, Required: ${item.quantity}`);
                    }
                }

                // P2: Generate movement IDs inside transaction using findFirst
                const year = new Date().getFullYear();
                const prefix = `SM-${year}`;
                const lastMovement = await tx.stockMovement.findFirst({
                    where: { movementId: { startsWith: prefix } },
                    orderBy: { movementId: 'desc' },
                    select: { movementId: true },
                });
                let counter = 0;
                if (lastMovement) {
                    const parts = lastMovement.movementId.split('-');
                    const num = parseInt(parts[2]);
                    if (!isNaN(num)) counter = num;
                }

                for (const item of order.orderItems) {
                    const fp = item.product.finishedProduct;
                    if (fp) {
                        // Release reservation and deduct stock
                        await tx.finishedProduct.update({
                            where: { id: fp.id },
                            data: {
                                reservedStock: { decrement: item.quantity },
                                currentStock: { decrement: item.quantity },
                            },
                        });

                        // Create audit log
                        counter++;
                        const movementId = `${prefix}-${String(counter).padStart(4, '0')}`;

                        await tx.stockMovement.create({
                            data: {
                                movementId,
                                type: 'STOCK_OUT',
                                reason: 'ORDER_FULFILLMENT',
                                quantity: item.quantity,
                                referenceId: order.orderNumber,
                                finishedProductId: fp.id,
                                notes: `Auto-deducted for order ${order.orderNumber}`,
                            },
                        });
                    }
                }

                // Update fulfillment status
                await tx.order.update({
                    where: { id: orderId },
                    data: { fulfillmentStatus: 'fulfilled' },
                });
            }

            // --- CANCEL: Rollback reservations ---
            if (newStatus === 'cancelled') {
                // Only rollback if was confirmed or processing (stock was reserved)
                if (currentStatus === 'confirmed' || currentStatus === 'processing') {
                    for (const item of order.orderItems) {
                        const fp = item.product.finishedProduct;
                        if (fp) {
                            await tx.finishedProduct.update({
                                where: { id: fp.id },
                                data: { reservedStock: { decrement: item.quantity } },
                            });
                        }
                    }
                }
            }

            // --- DELIVERED: Auto-create revenue transaction ---
            if (newStatus === 'delivered') {
                // P2: Generate TXN ID inside transaction using findFirst
                const year = new Date().getFullYear();
                const txnPrefix = `TXN-${year}`;
                const lastTxn = await tx.transaction.findFirst({
                    where: { transactionId: { startsWith: txnPrefix } },
                    orderBy: { transactionId: 'desc' },
                    select: { transactionId: true },
                });
                let txnNum = 1;
                if (lastTxn) {
                    const parts = lastTxn.transactionId.split('-');
                    const num = parseInt(parts[2]);
                    if (!isNaN(num)) txnNum = num + 1;
                }
                const txnId = `${txnPrefix}-${String(txnNum).padStart(4, '0')}`;

                await tx.transaction.create({
                    data: {
                        transactionId: txnId,
                        type: 'revenue',
                        amount: order.grandTotal,
                        description: `Revenue from order ${order.orderNumber}`,
                        referenceId: order.orderNumber,
                        orderId: order.id,
                    },
                });

                await tx.order.update({
                    where: { id: orderId },
                    data: { fulfillmentStatus: 'fulfilled' },
                });
            }

            // Update order status
            await tx.order.update({
                where: { id: orderId },
                data: { status: newStatus },
            });
        });

        revalidatePath('/sales/orders');
        revalidatePath('/inventory/finished');
        revalidatePath('/finance');
        return { success: true };
    } catch (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: 'Failed to update order status.' };
    }
}
