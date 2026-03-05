import { Metadata } from 'next';
import RawMaterialsClient from './RawMaterialsClient';
import { getRawMaterials } from '@/app/actions/inventory/raw-materials';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
    title: 'Raw Materials Inventory - Safcha Dashboard',
    description: 'Manage raw materials, low stock alerts, and track inventory for production.',
};


export default async function RawMaterialsPage({ params }: { params: Promise<{ businessSlug: string }> }) {
    const { businessSlug } = await params;
    // We fetch initial data to populate the client component quickly, but Zustand will manage it inside
    const initialData = await getRawMaterials();
    const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true, isActive: true }, where: { isActive: true }, orderBy: { name: 'asc' } });

    const props = {
        initialMaterials: initialData.success ? ('materials' in initialData ? initialData.materials : []) : [],
        suppliers,
        businessSlug
    };

    return <RawMaterialsClient {...(props as any)} />;
}
