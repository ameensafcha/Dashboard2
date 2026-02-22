'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@prisma/client';

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
    draft: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],  // terminal
    cancelled: [],  // terminal
};

export async function getValidNextStatuses(currentStatus: string): Promise<string[]> {
    return VALID_TRANSITIONS[currentStatus] || [];
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
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
                // Generate movement IDs
                const year = new Date().getFullYear();
                const countBase = await tx.stockMovement.count({
                    where: { movementId: { startsWith: `SM-${year}` } },
                });

                let counter = countBase;

                for (const item of order.orderItems) {
                    const fp = item.product.finishedProduct;
                    if (fp) {
                        // Release reservation
                        await tx.finishedProduct.update({
                            where: { id: fp.id },
                            data: {
                                reservedStock: { decrement: item.quantity },
                                currentStock: { decrement: item.quantity },
                            },
                        });

                        // Create audit log
                        counter++;
                        const movementId = `SM-${year}-${String(counter).padStart(4, '0')}`;

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
                // Generate TXN ID
                const year = new Date().getFullYear();
                const txnCount = await tx.transaction.count({
                    where: { transactionId: { startsWith: `TXN-${year}` } },
                });
                const txnId = `TXN-${year}-${String(txnCount + 1).padStart(4, '0')}`;

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
