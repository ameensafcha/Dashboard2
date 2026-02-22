import { getProductsOverview } from '@/app/actions/product/overview';
import ProductsOverviewClient from './ProductsOverviewClient';

export default async function ProductsOverview() {
    const data = await getProductsOverview();
    return <ProductsOverviewClient data={data} />;
}
