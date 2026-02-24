'use server';

import prisma from '@/lib/prisma';
import { OrderChannel, OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { toSafeNumber } from '@/lib/decimal';
import { createAuditLog } from '@/lib/audit';

// ===================== Validation Schemas =====================

const orderItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().int().positive('Quantity must be at least 1'),
    unitPrice: z.number().nonnegative('Unit price cannot be negative'),
    discount: z.number().nonnegative('Discount cannot be negative'),
});

const createOrderSchema = z.object({
    clientId: z.string().min(1, 'Client is required'),
    companyId: z.string().optional(),
    channel: z.nativeEnum(OrderChannel),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
    subTotal: z.number().nonnegative(),
    discount: z.number().nonnegative(),
    vat: z.number().nonnegative(),
    shippingCost: z.number().nonnegative(),
    grandTotal: z.number().nonnegative(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ===================== Queries =====================

export async function getOrders(search?: string, channel?: OrderChannel, status?: OrderStatus) {
    try {
        const whereClause: any = { deletedAt: null };

        if (channel && channel !== 'all' as any) {
            whereClause.channel = channel;
        }

        if (status && status !== 'all' as any) {
            whereClause.status = status;
        }

        if (search) {
            whereClause.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                {
                    client: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                },
                {
                    company: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                }
            ];
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                client: { select: { id: true, name: true } },
                company: { select: { id: true, name: true } },
                orderItems: {
                    include: {
                        product: { select: { id: true, name: true } }
                    }
                },
                invoice: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Convert Decimal to Number for frontend
        const serializedOrders = orders.map(order => ({
            ...order,
            subTotal: toSafeNumber(order.subTotal),
            discount: toSafeNumber(order.discount),
            vat: toSafeNumber(order.vat),
            shippingCost: toSafeNumber(order.shippingCost),
            grandTotal: toSafeNumber(order.grandTotal),
            orderItems: order.orderItems.map(item => ({
                ...item,
                unitPrice: toSafeNumber(item.unitPrice),
                discount: toSafeNumber(item.discount),
                total: toSafeNumber(item.total),
                productName: item.product?.name || 'Unknown Product',
            })),
            invoice: order.invoice ? {
                ...order.invoice,
                totalAmount: toSafeNumber(order.invoice.totalAmount)
            } : null
        }));

        return { success: true, orders: serializedOrders };
    } catch (error) {
        console.error('Failed to get orders:', error);
        return { success: false, error: 'Failed to fetch orders' };
    }
}

// ===================== Mutations =====================

export async function createOrder(data: CreateOrderInput) {
    try {
        // Zod validation
        const parsed = createOrderSchema.safeParse(data);
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            return { success: false, error: firstIssue.message };
        }
        const validated = parsed.data;

        const { generateOrderNumber } = await import('./utils');
        const orderNumber = await generateOrderNumber();

        // Calculate item totals
        const itemsWithTotals = validated.items.map(item => ({
            ...item,
            total: toSafeNumber((item.quantity * item.unitPrice) - item.discount)
        }));

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    clientId: validated.clientId,
                    companyId: validated.companyId || null,
                    channel: validated.channel,
                    status: 'draft',
                    paymentStatus: 'pending',
                    fulfillmentStatus: 'unfulfilled',
                    subTotal: validated.subTotal,
                    discount: validated.discount,
                    vat: validated.vat,
                    shippingCost: validated.shippingCost,
                    grandTotal: validated.grandTotal,
                    notes: validated.notes,

                    orderItems: {
                        create: itemsWithTotals
                    }
                },
                include: {
                    client: { select: { id: true, name: true } },
                    company: { select: { id: true, name: true } },
                    orderItems: true
                }
            });

            // Create audit log
            await createAuditLog(tx, {
                action: 'CREATE',
                entity: 'Order',
                entityId: newOrder.orderNumber,
                details: { after: validated }
            });

            return newOrder;
        });

        revalidatePath('/sales/orders');
        revalidatePath('/');
        return { success: true, orderId: order.id };
    } catch (error: any) {
        console.error('Detailed Order Creation Error:', error);
        return { success: false, error: error.message || 'Failed to create order' };
    }
}

export async function deleteOrder(id: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // Soft delete linked transactions
            await tx.transaction.updateMany({
                where: { orderId: id, type: 'revenue' },
                data: { deletedAt: new Date() }
            });
            // Soft delete order
            const deletedOrder = await tx.order.update({
                where: { id },
                data: { deletedAt: new Date() }
            });

            // Create audit log
            await createAuditLog(tx, {
                action: 'SOFT_DELETE',
                entity: 'Order',
                entityId: deletedOrder.orderNumber,
                details: {
                    reason: 'User deleted order',
                    deletedAt: new Date()
                }
            });
        });

        revalidatePath('/sales/orders');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting order:', error);
        return { success: false, error: 'Failed to delete order' };
    }
}
