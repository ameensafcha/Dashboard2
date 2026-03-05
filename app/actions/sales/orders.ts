'use server';

import prisma from '@/lib/prisma';
import { OrderChannel, OrderStatus } from '@prisma/client';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { z } from 'zod';
import { toSafeNumber } from '@/lib/decimal';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { serializeValues } from '@/lib/utils';

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

export async function getOrders(businessSlug?: string, search?: string, channel?: OrderChannel, status?: OrderStatus) {
    try {
        const ctx = await getBusinessContext(businessSlug);
        if (!hasPermission(ctx, 'orders', 'view')) {
            throw new Error('Unauthorized');
        }

        const getCachedOrdersList = unstable_cache(
            async (bId: string, qSearch?: string, qChannel?: OrderChannel, qStatus?: OrderStatus) => {
                const wc: any = { deletedAt: null, businessId: bId };
                if (qChannel && qChannel !== 'all' as any) wc.channel = qChannel;
                if (qStatus && qStatus !== 'all' as any) wc.status = qStatus;
                if (qSearch) {
                    wc.OR = [
                        { orderNumber: { contains: qSearch, mode: 'insensitive' } },
                        { client: { name: { contains: qSearch, mode: 'insensitive' } } },
                        { company: { name: { contains: qSearch, mode: 'insensitive' } } }
                    ];
                }
                return await prisma.order.findMany({
                    where: wc,
                    include: {
                        client: { select: { id: true, name: true } },
                        company: { select: { id: true, name: true } },
                        orderItems: { include: { product: { select: { id: true, name: true } } } },
                        invoice: true
                    },
                    orderBy: { createdAt: 'desc' }
                });
            },
            [`orders-list-${ctx.businessId}-${search || ''}-${channel || ''}-${status || ''}`],
            { tags: [`orders-${ctx.businessId}`], revalidate: 3600 }
        );

        const orders = await getCachedOrdersList(ctx.businessId, search, channel, status);

        return serializeValues({ success: true, orders });
    } catch (error) {
        console.error('Failed to get orders:', error);
        return { success: false, error: 'Failed to fetch orders' };
    }
}

// ===================== Mutations =====================

export async function createOrder(data: CreateOrderInput) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'orders', 'create')) {
            throw new Error('Unauthorized');
        }
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
            businessId: ctx.businessId,
            total: toSafeNumber((item.quantity * item.unitPrice) - item.discount)
        }));

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    businessId: ctx.businessId,
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
            await logAudit({
                action: 'CREATE',
                entity: 'Order',
                entityId: newOrder.orderNumber,
                details: { after: validated },
                module: 'orders',
                entityName: 'Sales Order'
            });

            return newOrder;
        }, {
            timeout: 15000
        });

        revalidatePath('/sales/orders');
        revalidatePath('/');

        // Revalidate dashboard cache
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-feed-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-inventory-${ctx.businessId}`, { expire: 0 });

        return { success: true, orderId: order.id };
    } catch (error: any) {
        console.error('Detailed Order Creation Error:', error);
        return { success: false, error: error.message || 'Failed to create order' };
    }
}

export async function deleteOrder(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'orders', 'delete')) {
            throw new Error('Unauthorized');
        }

        // 1. Fetch order with items and products to handle stock reversal
        const existingOrder = await prisma.order.findUnique({
            where: { id, businessId: ctx.businessId },
            include: {
                orderItems: {
                    include: {
                        product: {
                            include: {
                                finishedProduct: true
                            }
                        }
                    }
                }
            }
        });

        if (!existingOrder) throw new Error('Order not found');

        await prisma.$transaction(async (tx) => {
            // 2. Release reserved stock if order was confirmed or processing
            if (existingOrder.status === 'confirmed' || existingOrder.status === 'processing') {
                for (const item of existingOrder.orderItems) {
                    const fp = item.product.finishedProduct;
                    if (fp) {
                        await tx.finishedProduct.update({
                            where: { id: fp.id },
                            data: {
                                reservedStock: { decrement: item.quantity }
                            }
                        });
                    }
                }
            }

            // 3. Soft delete linked transactions
            await tx.transaction.updateMany({
                where: { orderId: id, type: 'revenue' },
                data: { deletedAt: new Date() }
            });

            // 4. Soft delete order
            const deletedOrder = await tx.order.update({
                where: { id },
                data: { deletedAt: new Date() }
            });

            // 5. Create audit log
            await logAudit({
                action: 'SOFT_DELETE',
                entity: 'Order',
                entityId: deletedOrder.orderNumber,
                details: {
                    reason: 'User deleted order',
                    deletedAt: new Date(),
                    wasStatus: existingOrder.status
                },
                module: 'orders',
                entityName: 'Sales Order',
                description: 'Deleted sales order'
            });
        }, {
            timeout: 15000
        });

        revalidatePath('/sales/orders');
        revalidatePath('/inventory/finished');
        revalidatePath('/');

        // Revalidate dashboard cache
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-feed-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-inventory-${ctx.businessId}`, { expire: 0 });

        return { success: true };
    } catch (error) {
        console.error('Error deleting order:', error);
        return { success: false, error: 'Failed to delete order' };
    }
}


export async function updateOrder(id: string, data: CreateOrderInput) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'orders', 'edit')) {
            throw new Error('Unauthorized');
        }
        // Zod validation
        const parsed = createOrderSchema.safeParse(data);
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            return { success: false, error: firstIssue.message };
        }
        const validated = parsed.data;

        // Verify it's a draft and belongs to business
        const existingOrder = await prisma.order.findUnique({
            where: { id, businessId: ctx.businessId },
            select: { status: true, orderNumber: true }
        });

        if (!existingOrder) return { success: false, error: 'Order not found' };
        if (existingOrder.status !== 'draft') return { success: false, error: 'Only draft orders can be modified' };

        // Calculate item totals
        const itemsWithTotals = validated.items.map(item => ({
            ...item,
            businessId: ctx.businessId,
            total: toSafeNumber((item.quantity * item.unitPrice) - item.discount)
        }));

        const order = await prisma.$transaction(async (tx) => {
            // 1. Delete old items
            await tx.orderItem.deleteMany({
                where: { orderId: id }
            });

            // 2. Update order
            const updatedOrder = await tx.order.update({
                where: { id },
                data: {
                    clientId: validated.clientId,
                    companyId: validated.companyId || null,
                    channel: validated.channel,
                    notes: validated.notes,
                    subTotal: validated.subTotal,
                    discount: validated.discount,
                    vat: validated.vat,
                    shippingCost: validated.shippingCost,
                    grandTotal: validated.grandTotal,

                    orderItems: {
                        create: itemsWithTotals
                    }
                }
            });

            // 3. Create audit log
            await logAudit({
                action: 'UPDATE',
                entity: 'Order',
                entityId: existingOrder.orderNumber,
                details: { after: validated },
                module: 'orders',
                entityName: 'Sales Order'
            });

            return updatedOrder;
        }, {
            timeout: 15000
        });

        revalidatePath('/sales/orders');
        revalidatePath(`/sales/orders/${id}`);
        revalidatePath('/');

        // Revalidate dashboard cache
        revalidateTag(`dashboard-kpi-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-feed-${ctx.businessId}`, { expire: 0 });
        revalidateTag(`dashboard-inventory-${ctx.businessId}`, { expire: 0 });

        return { success: true, orderId: order.id };
    } catch (error: any) {
        console.error('Order Update Error:', error);
        return { success: false, error: error.message || 'Failed to update order' };
    }
}
