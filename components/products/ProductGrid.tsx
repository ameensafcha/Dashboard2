'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/stores/productStore';
import { useAppStore } from '@/stores/appStore';
import { productStatuses, sfdaStatuses } from '@/app/actions/product/types';
import { Edit, Trash2, Package, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getProduct } from '@/app/actions/product/actions';

interface ProductGridProps {
  products: any[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-[#2D6A4F] text-white',
  in_development: 'bg-[#E8A838] text-black',
  discontinued: 'bg-[#D32F2F] text-white',
};

export function ProductCard({ product, onClick }: { product: any; onClick: () => void }) {
  const { isRTL } = useAppStore();

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square flex items-center justify-center relative" style={{ background: 'var(--muted)' }}>
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-16 h-16" style={{ color: 'var(--text-muted)' }} />
        )}
        <Badge 
          className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} ${statusColors[product.status]}`}
        >
          {productStatuses.find(s => s.value === product.status)?.label}
        </Badge>
      </div>
      <CardContent className="p-4">
        <p className="font-mono text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{product.skuPrefix}</p>
        <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--foreground)' }}>{product.name}</h3>
        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          {product.category?.name || '-'}
        </p>
        <div className="flex items-center justify-between">
          <p className="font-semibold" style={{ color: 'var(--accent-gold)' }}>SAR {Number(product.baseRetailPrice).toFixed(2)}</p>
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
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <Skeleton className="h-6 w-24" />
      </CardContent>
    </Card>
  );
}

export default function ProductGrid({ products, isLoading }: ProductGridProps) {
  const { isRTL } = useAppStore();
  const { setSelectedProduct, setModalOpen, setProductToDelete, setDeleteModalOpen, isModalOpen } = useProductStore();
  const [selectedProduct, setSelectedProductState] = useState<any>(null);

  useEffect(() => {
    const handleRefresh = async () => {
      if (selectedProduct?.id) {
        const updated = await getProduct(selectedProduct.id);
        if (updated) {
          setSelectedProductState(updated);
        }
      }
    };
    handleRefresh();

    const handleDeleted = (e: any) => {
      if (selectedProduct?.id === e.detail.id) {
        setSelectedProductState(null);
      }
    };
    window.addEventListener('product-deleted', handleDeleted);
    return () => window.removeEventListener('product-deleted', handleDeleted);
  }, [isModalOpen]);

  const handleClose = () => setSelectedProductState(null);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProduct(selectedProduct.id);
    setModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDelete(selectedProduct.id);
    setDeleteModalOpen(true);
    setSelectedProductState(null);
  };

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
        <Package className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)' }}>
          {isRTL ? 'لا توجد منتجات' : 'No products found'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onClick={() => setSelectedProductState(product)} 
          />
        ))}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl" style={{ background: 'var(--card)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{selectedProduct.name}</h2>
              <div className="flex items-center gap-2">
                <Button onClick={handleEdit} className="bg-[#E8A838] hover:bg-[#d49a2d] text-black gap-2">
                  <Edit className="w-4 h-4" />
                  {isRTL ? 'تعديل' : 'Edit'}
                </Button>
                <Button onClick={handleDelete} variant="destructive" className="bg-[#D32F2F] hover:bg-[#b71c1c] text-white gap-2">
                  <Trash2 className="w-4 h-4" />
                  {isRTL ? 'حذف' : 'Delete'}
                </Button>
                <button onClick={handleClose} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row max-h-[calc(90vh-80px)] overflow-y-auto">
              <div className="w-full md:w-1/2 p-6 flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-64 object-cover rounded-lg" />
                ) : (
                  <Package className="w-32 h-32" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              <div className="w-full md:w-1/2 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الرمز' : 'SKU'}</p>
                    <p className="font-mono font-medium" style={{ color: 'var(--foreground)' }}>{selectedProduct.skuPrefix}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الحالة' : 'Status'}</p>
                    <Badge className={statusColors[selectedProduct.status]}>
                      {productStatuses.find(s => s.value === selectedProduct.status)?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الفئة' : 'Category'}</p>
                    <p style={{ color: 'var(--foreground)' }}>{selectedProduct.category?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الحالة FDA' : 'SFDA Status'}</p>
                    <Badge className={selectedProduct.sfdaStatus === 'approved' ? 'bg-[#2D6A4F] text-white' : selectedProduct.sfdaStatus === 'pending' ? 'bg-[#E8A838] text-black' : 'bg-gray-400 text-white'}>
                      {sfdaStatuses.find(s => s.value === selectedProduct.sfdaStatus)?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'التكلفة' : 'Base Cost'}</p>
                    <p style={{ color: 'var(--foreground)' }}>SAR {Number(selectedProduct.baseCost).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'سعر البيع' : 'Retail Price'}</p>
                    <p className="font-semibold" style={{ color: 'var(--accent-gold)' }}>SAR {Number(selectedProduct.baseRetailPrice).toFixed(2)}</p>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الوصف' : 'Description'}</p>
                    <p style={{ color: 'var(--foreground)' }}>{selectedProduct.description}</p>
                  </div>
                )}

                {selectedProduct.keyIngredients && (
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'المكونات' : 'Key Ingredients'}</p>
                    <p style={{ color: 'var(--foreground)' }}>{selectedProduct.keyIngredients}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'خالي من الكافيين' : 'Caffeine-free'}:</span>
                  <Badge className={selectedProduct.caffeineFree ? 'bg-[#2D6A4F] text-white' : 'bg-gray-400 text-white'}>
                    {selectedProduct.caffeineFree ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
