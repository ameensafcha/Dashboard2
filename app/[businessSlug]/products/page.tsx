import { getProductsOverview } from '@/app/actions/product/overview';
import ProductsOverviewClient from './ProductsOverviewClient';

export const dynamic = 'force-dynamic';

export default async function ProductsOverview() {
    const data = await getProductsOverview();
    return <ProductsOverviewClient data={data} />;
}
