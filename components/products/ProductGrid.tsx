'use client';

import { useProductStore } from '@/stores/productStore';
import { useAppStore } from '@/stores/appStore';
import { productStatuses } from '@/app/actions/product/types';
import { Edit, Trash2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductGridProps {
  products: any[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-[#2D6A4F] text-white',
  in_development: 'bg-[#E8A838] text-black',
  discontinued: 'bg-[#D32F2F] text-white',
};

export function ProductCard({ product }: { product: any }) {
  const { setSelectedProduct, setModalOpen, setProductToDelete, setDeleteModalOpen } = useProductStore();
  const { isRTL } = useAppStore();

  const handleEdit = () => {
    setSelectedProduct(product.id);
    setModalOpen(true);
  };

  const handleDelete = () => {
    setProductToDelete(product.id);
    setDeleteModalOpen(true);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-16 h-16 text-gray-300" />
        )}
        <Badge 
          className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} ${statusColors[product.status]}`}
        >
          {productStatuses.find(s => s.value === product.status)?.label}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2">
          SKU: <span className="font-mono">{product.skuPrefix}</span>
        </p>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500">{isRTL ? 'التكلفة' : 'Cost'}</p>
            <p className="font-semibold">SAR {product.baseCost.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{isRTL ? 'السعر' : 'Price'}</p>
            <p className="font-semibold text-[#E8A838]">SAR {product.baseRetailPrice.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-gray-500">
            {product.caffeineFree ? (isRTL ? 'بدون كافيين' : 'Caffeine-free') : (isRTL ? 'يحتوي كافيين' : 'Contains caffeine')}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleEdit}
              className="p-2 text-gray-600 hover:text-[#E8A838] hover:bg-amber-50 rounded-lg transition-colors"
              title={isRTL ? 'تعديل' : 'Edit'}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-600 hover:text-[#D32F2F] hover:bg-red-50 rounded-lg transition-colors"
              title={isRTL ? 'حذف' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductCardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-square rounded-t-lg" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <div className="flex justify-between mb-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function ProductGrid({ products, isLoading }: ProductGridProps) {
  const { isRTL } = useAppStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(5)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">
          {isRTL ? 'لا توجد منتجات' : 'No products found'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
