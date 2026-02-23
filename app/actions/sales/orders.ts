'use server';

import prisma from '@/lib/prisma';
import { OrderChannel, OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
        const whereClause: any = {};

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
            subTotal: order.subTotal ? Number(order.subTotal.toString()) : 0,
            discount: order.discount ? Number(order.discount.toString()) : 0,
            vat: order.vat ? Number(order.vat.toString()) : 0,
            shippingCost: order.shippingCost ? Number(order.shippingCost.toString()) : 0,
            grandTotal: order.grandTotal ? Number(order.grandTotal.toString()) : 0,
            orderItems: order.orderItems.map(item => ({
                ...item,
                unitPrice: item.unitPrice ? Number(item.unitPrice.toString()) : 0,
                discount: item.discount ? Number(item.discount.toString()) : 0,
                total: item.total ? Number(item.total.toString()) : 0,
                productName: item.product?.name || 'Unknown Product',
            })),
            invoice: order.invoice ? {
                ...order.invoice,
                totalAmount: order.invoice.totalAmount ? Number(order.invoice.totalAmount.toString()) : 0
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
            total: (item.quantity * item.unitPrice) - item.discount
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

            return newOrder;
        });

        revalidatePath('/sales/orders');
        revalidatePath('/');
        return { success: true, orderId: order.id };
    } catch (error: any) {
        console.error('Detailed Order Creation Error:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return { success: false, error: error.message || 'Failed to create order' };
    }
}
