import prisma from '@/lib/prisma';
import NewOrderClient from './NewOrderClient';

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
        ...p,
        baseCost: Number(p.baseCost),
        baseRetailPrice: Number(p.baseRetailPrice),
        size: p.size ? Number(p.size) : null,
    }));

    const serializedCompanyPricingTiers = companyPricingTiers.map(cpt => ({
        ...cpt,
        pricingTier: {
            ...cpt.pricingTier,
            minOrderKg: Number(cpt.pricingTier.minOrderKg),
            maxOrderKg: Number(cpt.pricingTier.maxOrderKg),
            pricePerKg: Number(cpt.pricingTier.pricePerKg),
            discountPercent: Number(cpt.pricingTier.discountPercent),
            marginPercent: Number(cpt.pricingTier.marginPercent),
        }
    }));

    const serializedGlobalPricingTiers = globalPricingTiers.map(pt => ({
        ...pt,
        minOrderKg: Number(pt.minOrderKg),
        maxOrderKg: Number(pt.maxOrderKg),
        pricePerKg: Number(pt.pricePerKg),
        discountPercent: Number(pt.discountPercent),
        marginPercent: Number(pt.marginPercent),
    }));

    const serializedClients = clients.map(client => ({
        ...client,
        company: client.company ? {
            ...client.company,
            lifetimeValue: Number(client.company.lifetimeValue)
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
