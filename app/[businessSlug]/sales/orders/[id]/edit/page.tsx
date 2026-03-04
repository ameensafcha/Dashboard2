import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import EditOrderClient from './EditOrderClient';
import { toSafeNumber } from '@/lib/decimal';

export const metadata = {
    title: 'Edit Order | Safcha',
};

interface PageProps {
    params: {
        id: string;
    };
}

export default async function EditOrderPage({ params }: PageProps) {
    const { id } = await params;

    // 1. Fetch the Order with items
    const order = await prisma.order.findUnique({
        where: { id, deletedAt: null },
        include: {
            orderItems: {
                include: { product: true }
            }
        }
    });

    if (!order) notFound();
    if (order.status !== 'draft') {
        // Only draft orders can be edited
        redirect('/sales/orders');
    }

    // 2. Fetch Master Data
    const [finishedProducts, clients, companyPricingTiers, globalPricingTiers] = await Promise.all([
        prisma.finishedProduct.findMany({
            where: { deletedAt: null },
            include: { product: { include: { category: true } } },
            orderBy: { product: { name: 'asc' } }
        }),
        prisma.client.findMany({
            include: { company: true },
            orderBy: { name: 'asc' }
        }),
        prisma.companyPricingTier.findMany({
            include: { pricingTier: true }
        }),
        prisma.pricingTier.findMany({
            where: { isGlobal: true }
        })
    ]);

    // 3. Serializers
    const serializedOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        clientId: order.clientId,
        companyId: order.companyId,
        channel: order.channel,
        notes: order.notes,
        shippingCost: toSafeNumber(order.shippingCost, 2),
        items: order.orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: toSafeNumber(item.unitPrice, 2),
            discount: toSafeNumber(item.discount, 2),
        }))
    };

    const serializedProducts = finishedProducts.map(fp => ({
        id: fp.productId,
        productId: fp.productId,
        name: fp.product.name + (fp.variant ? ` (${fp.variant})` : ''),
        retailPrice: toSafeNumber(fp.retailPrice, 2),
        categoryId: fp.product.categoryId,
        category: fp.product.category ? { id: fp.product.category.id, name: fp.product.category.name } : null
    }));

    const serializedCompanyPricingTiers = companyPricingTiers.map(cpt => ({
        id: cpt.id,
        companyId: cpt.companyId,
        categoryId: cpt.categoryId,
        pricingTier: cpt.pricingTier ? {
            id: cpt.pricingTier.id,
            pricePerKg: toSafeNumber(cpt.pricingTier.pricePerKg, 2),
            tierName: cpt.pricingTier.tierName,
        } : null
    }));

    const serializedGlobalPricingTiers = globalPricingTiers.map(pt => ({
        id: pt.id,
        pricePerKg: toSafeNumber(pt.pricePerKg, 2),
        tierName: pt.tierName,
    }));

    const serializedClients = clients.map(client => ({
        id: client.id,
        name: client.name,
        companyId: client.companyId,
        company: client.company ? {
            id: client.company.id,
            name: client.company.name,
            lifetimeValue: toSafeNumber(client.company.lifetimeValue, 2)
        } : null
    }));

    // Extract unique companies from serialized clients
    const serializedCompanies = Array.from(
        new Map(
            serializedClients
                .map(c => c.company)
                .filter((c): c is NonNullable<typeof c> => !!c)
                .map(c => [c.id, c])
        ).values()
    );

    return (
        <EditOrderClient
            order={serializedOrder}
            clients={serializedClients}
            products={serializedProducts}
            companies={serializedCompanies}
            companyPricingTiers={serializedCompanyPricingTiers}
            globalPricingTiers={serializedGlobalPricingTiers}
        />
    );
}
