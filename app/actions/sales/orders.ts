'use server';

import prisma from '@/lib/prisma';
import { OrderChannel, OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

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
                orderItems: true,
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
                total: item.total ? Number(item.total.toString()) : 0
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

export type CreateOrderInput = {
    clientId: string;
    companyId?: string;
    channel: OrderChannel;
    notes?: string;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        discount: number;
    }[];
    subTotal: number;
    discount: number;
    vat: number;
    shippingCost: number;
    grandTotal: number;
};

export async function createOrder(data: CreateOrderInput) {
    try {
        const { generateOrderNumber } = await import('./utils');
        const orderNumber = await generateOrderNumber();

        // Validate items
        if (!data.items || data.items.length === 0) {
            return { success: false, error: 'Order must contain at least one item' };
        }

        // Calculate item totals
        const itemsWithTotals = data.items.map(item => ({
            ...item,
            total: (item.quantity * item.unitPrice) - item.discount
        }));

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    clientId: data.clientId,
                    companyId: data.companyId || null,
                    channel: data.channel,
                    status: 'draft', // New orders start as draft by default
                    paymentStatus: 'pending',
                    fulfillmentStatus: 'unfulfilled',
                    subTotal: data.subTotal,
                    discount: data.discount,
                    vat: data.vat,
                    shippingCost: data.shippingCost,
                    grandTotal: data.grandTotal,
                    notes: data.notes,

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
        return { success: true, orderId: order.id };
    } catch (error) {
        console.error('Failed to create order:', error);
        return { success: false, error: 'Failed to create order' };
    }
}
