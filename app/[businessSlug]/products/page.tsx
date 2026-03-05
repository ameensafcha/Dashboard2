import { getProductsOverview } from '@/app/actions/product/overview';
import ProductsOverviewClient from './ProductsOverviewClient';


export default async function ProductsOverview({ params }: { params: Promise<{ businessSlug: string }> }) {
    const { businessSlug } = await params;
    const data = await getProductsOverview();
    return <ProductsOverviewClient data={data} businessSlug={businessSlug} />;
}
