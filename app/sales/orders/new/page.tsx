import prisma from '@/lib/prisma';
import NewOrderClient from './NewOrderClient';
import { toSafeNumber } from '@/lib/decimal';

export const metadata = {
    title: 'New Order | Safcha',
};

export default async function NewOrderPage() {
    // Fetch clients with their company details
    const clients = await prisma.client.findMany({
        include: { company: true },
        orderBy: { name: 'asc' }
    });

    // Fetch active products with categories
    const products = await prisma.product.findMany({
        where: { status: 'active' },
        include: { category: true },
        orderBy: { name: 'asc' }
    });

    // Fetch company-specific pricing tiers
    const companyPricingTiers = await prisma.companyPricingTier.findMany({
        include: {
            pricingTier: true
        }
    });

    // Fetch global pricing tiers for fallbacks or B2C
    const globalPricingTiers = await prisma.pricingTier.findMany({
        where: { isGlobal: true }
    });

    // Serialize Decimal values to numbers for Client Component
    const serializedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        categoryId: p.categoryId,
        baseCost: toSafeNumber(p.baseCost, 2),
        baseRetailPrice: toSafeNumber(p.baseRetailPrice, 2),
        size: toSafeNumber(p.size, 3),
        unit: p.unit,
        status: p.status,
        image: p.image,
        category: p.category ? {
            id: p.category.id,
            name: p.category.name
        } : null
    }));

    const serializedCompanyPricingTiers = companyPricingTiers.map(cpt => ({
        id: cpt.id,
        companyId: cpt.companyId,
        categoryId: cpt.categoryId,
        pricingTierId: cpt.pricingTierId,
        pricingTier: cpt.pricingTier ? {
            id: cpt.pricingTier.id,
            tierName: cpt.pricingTier.tierName,
            minOrderKg: toSafeNumber(cpt.pricingTier.minOrderKg, 3),
            maxOrderKg: toSafeNumber(cpt.pricingTier.maxOrderKg, 3),
            pricePerKg: toSafeNumber(cpt.pricingTier.pricePerKg, 2),
            discountPercent: toSafeNumber(cpt.pricingTier.discountPercent, 2),
            marginPercent: toSafeNumber(cpt.pricingTier.marginPercent, 2),
            isGlobal: cpt.pricingTier.isGlobal,
        } : null
    }));

    const serializedGlobalPricingTiers = globalPricingTiers.map(pt => ({
        id: pt.id,
        tierName: pt.tierName,
        minOrderKg: toSafeNumber(pt.minOrderKg, 3),
        maxOrderKg: toSafeNumber(pt.maxOrderKg, 3),
        pricePerKg: toSafeNumber(pt.pricePerKg, 2),
        discountPercent: toSafeNumber(pt.discountPercent, 2),
        marginPercent: toSafeNumber(pt.marginPercent, 2),
        isGlobal: pt.isGlobal,
    }));

    const serializedClients = clients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        companyId: client.companyId,
        company: client.company ? {
            id: client.company.id,
            name: client.company.name,
            lifetimeValue: toSafeNumber(client.company.lifetimeValue, 2)
        } : null
    }));

    return (
        <NewOrderClient
            clients={serializedClients}
            products={serializedProducts}
            companyPricingTiers={serializedCompanyPricingTiers}
            globalPricingTiers={serializedGlobalPricingTiers}
        />
    );
}
