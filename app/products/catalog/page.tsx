import { Suspense } from 'react';
import { getProducts, ProductsResponse } from '@/app/actions/product/actions';
import ProductList from './ProductList';
import { PageHeader } from '@/components/ui/PageHeader';

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
    <div className="p-4 sm:p-6">
      <PageHeader title="Product Catalog" />

      <Suspense fallback={<div>Loading...</div>}>
        <ProductList initialData={data} />
      </Suspense>
    </div>
  );
}
