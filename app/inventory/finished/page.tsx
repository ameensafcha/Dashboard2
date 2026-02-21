import { Metadata } from 'next';
import FinishedProductsClient from './FinishedProductsClient';
import { getFinishedProducts } from '@/app/actions/inventory/finished-products';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
    title: 'Finished Products Inventory - Safcha Dashboard',
    description: 'Track finished product stock, reservations, and availability.',
};

export default async function FinishedProductsPage() {
    const initialData = await getFinishedProducts();
    const catalogProducts = await prisma.product.findMany({
        select: { id: true, name: true, skuPrefix: true },
        where: { status: 'active' },
        orderBy: { name: 'asc' },
    });

    return <FinishedProductsClient
        initialProducts={initialData.success ? initialData.products : []}
        catalogProducts={catalogProducts}
    />;
}
