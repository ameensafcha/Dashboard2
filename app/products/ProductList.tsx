'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProductStore } from '@/stores/productStore';
import { ProductsResponse, getProducts } from '@/app/actions/product/actions';
import ViewToggle from '@/components/products/ViewToggle';
import ProductFilters from '@/components/products/ProductFilters';
import ProductTable from '@/components/products/ProductTable';
import ProductGrid from '@/components/products/ProductGrid';
import ProductModal from '@/components/products/ProductModal';
import DeleteConfirmModal from '@/components/products/DeleteConfirmModal';
import Pagination from '@/components/products/Pagination';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ProductListProps {
  initialData: ProductsResponse;
}

export default function ProductList({ initialData }: ProductListProps) {
  const router = useRouter();
  const { viewMode, filters, setFilters, setModalOpen, isLoading, setLoading } = useProductStore();
  
  const [data, setData] = useState<ProductsResponse>(initialData);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProducts({
        page: currentPage,
        limit: 5,
        search: filters.search,
        status: filters.status,
      });
      setData(result);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters.search, filters.status, setLoading]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddProduct = () => {
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <ProductFilters />
        
        <div className="flex items-center gap-3">
          <ViewToggle />
          <Button
            onClick={handleAddProduct}
            className="bg-[#E8A838] hover:bg-[#d49a2d] text-black gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <ProductTable products={data.products} isLoading={isLoading} />
      ) : (
        <ProductGrid products={data.products} isLoading={isLoading} />
      )}

      <Pagination
        currentPage={data.page}
        totalPages={data.totalPages}
        total={data.total}
        onPageChange={handlePageChange}
      />

      <ProductModal />
      <DeleteConfirmModal />
    </div>
  );
}
