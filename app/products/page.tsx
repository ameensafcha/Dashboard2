import { Suspense } from 'react';
import { getProducts, ProductsResponse } from '@/app/actions/product/actions';
import ProductList from './ProductList';

export const metadata = {
  title: 'Products - Safcha Dashboard',
  description: 'Manage your product catalog',
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const search = params.search || '';
  const status = params.status || '';

  const data: ProductsResponse = await getProducts({
    page,
    limit: 5,
    search,
    status,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">
          Product Catalog
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your products, variants, and pricing
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ProductList initialData={data} />
      </Suspense>
    </div>
  );
}
