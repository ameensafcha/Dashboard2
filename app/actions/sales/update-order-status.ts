'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';

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
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'orders', 'edit')) {
            throw new Error('Unauthorized');
        }

        // 1. Fetch order with items and their linked finished products
        const order = await prisma.order.findFirst({
            where: { id: orderId, deletedAt: null, businessId: ctx.businessId },
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

                // Generate movement prefix
                const year = new Date().getFullYear();

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

                        // Create unique movement ID
                        const timestamp = Date.now().toString(36).toUpperCase();
                        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
                        const movementId = `SM-${year}-${timestamp}-${random}`;

                        await tx.stockMovement.create({
                            data: {
                                businessId: ctx.businessId,
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
                // Generate unique transaction ID
                const year = new Date().getFullYear();
                const timestamp = Date.now().toString(36).toUpperCase();
                const random = Math.random().toString(36).substring(2, 5).toUpperCase();
                const txnId = `TXN-${year}-${timestamp}-${random}`;

                await tx.transaction.create({
                    data: {
                        businessId: ctx.businessId,
                        transactionId: txnId,
                        type: 'revenue',
                        amount: order.grandTotal,
                        description: `Revenue from order ${order.orderNumber}`,
                        referenceId: order.orderNumber,
                        orderId: order.id,
                    },
                });
            }

            // Update order status
            await tx.order.update({
                where: { id: orderId },
                data: { status: newStatus },
            });

            // Create audit log
            await logAudit({
                action: 'UPDATE_STATUS',
                entity: 'Order',
                entityId: order.orderNumber,
                module: 'orders',
                entityName: 'Sales Order',
                details: {
                    before: currentStatus,
                    after: newStatus
                }
            });
        }, { timeout: 15000 });


        revalidatePath('/sales/orders');
        revalidatePath('/inventory/finished');
        revalidatePath('/finance');
        revalidatePath('/');

        // Revalidate granular dashboard cache
        revalidateTag(`orders-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`sales-overview-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-charts-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-feed-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-inventory-${ctx.businessId}`, { expire: 0 });

        return { success: true };
    } catch (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: 'Failed to update order status.' };
    }
}
