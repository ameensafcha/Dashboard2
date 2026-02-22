'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/stores/productStore';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/lib/i18n';
import { productStatuses, sfdaStatuses } from '@/app/actions/product/types';
import { Edit, Trash2, Package, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getProduct, ProductsResponse } from '@/app/actions/product/actions';
import Image from 'next/image';

type ProductType = ProductsResponse['products'][0];

interface ProductGridProps {
  products: ProductType[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-[#2D6A4F] text-white',
  in_development: 'bg-[#E8A838] text-black',
  discontinued: 'bg-[#D32F2F] text-white',
};

export function ProductCard({ product, onClick }: { product: ProductType; onClick: () => void }) {
  const { t, isRTL } = useTranslation();

  return (
    <Card
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden border-[var(--border)]"
      onClick={onClick}
      style={{ background: 'var(--card)' }}
    >
      <div className="aspect-square flex items-center justify-center relative" style={{ background: 'var(--muted)' }}>
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover" />
        ) : (
          <Package className="w-16 h-16" style={{ color: 'var(--text-muted)' }} />
        )}
        <Badge
          className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} ${statusColors[product.status]}`}
        >
          {t[product.status as keyof typeof t] || product.status}
        </Badge>
      </div>
      <CardContent className="p-4">
        <p className="font-mono text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{product.skuPrefix}</p>
        <h3 className="font-semibold text-lg mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          {product.category?.name || '-'}
        </p>
        <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="font-semibold" style={{ color: 'var(--accent-gold)' }}>SAR {Number(product.baseRetailPrice).toFixed(2)}</p>
          {product.size && (
            <Badge variant="outline" className="text-xs font-normal" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              {Number(product.size)} {product.unit || ''}
            </Badge>
          )}
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
  const { t, isRTL } = useTranslation();
  const { setSelectedProduct, setModalOpen, setProductToDelete, setDeleteModalOpen, isModalOpen } = useProductStore();
  const [selectedProduct, setSelectedProductState] = useState<ProductType | null>(null);

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

    const handleDeleted = (e: CustomEvent<{ id: string }>) => {
      if (selectedProduct?.id === e.detail.id) {
        setSelectedProductState(null);
      }
    };
    window.addEventListener('product-deleted', handleDeleted as EventListener);
    return () => window.removeEventListener('product-deleted', handleDeleted as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);



  const handleClose = () => setSelectedProductState(null);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedProduct) {
      setSelectedProduct(selectedProduct.id);
      setModalOpen(true);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedProduct) {
      setProductToDelete(selectedProduct.id);
      setDeleteModalOpen(true);
      setSelectedProductState(null);
    }
  };



  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-[var(--muted)]/20 shadow-sm" style={{ borderColor: 'var(--border)' }}>
        <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4 border shadow-inner" style={{ borderColor: 'var(--border)' }}>
          <Package className="w-8 h-8 opacity-40 text-[var(--text-secondary)]" />
        </div>
        <h3 className="text-lg font-semibold mb-1 text-[var(--text-primary)]">{t.noProductsYet || 'No products yet'}</h3>
        <p className="text-sm max-w-xs mx-auto text-[var(--text-secondary)]">{t.addFirstProduct || 'Add your first product to get started'}</p>
        <Button
          onClick={() => setModalOpen(true)}
          variant="outline"
          className="mt-6 border-[#E8A838] text-[#E8A838] hover:bg-[#E8A838]/10 shadow-sm transition-all active:scale-95"
        >
          {t.addNewProduct || 'Add Product'}
        </Button>
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
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedProduct.name}</h2>
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
                  <div className="relative w-full h-64">
                    <Image src={selectedProduct.image} alt={selectedProduct.name} fill className="object-cover rounded-lg" />
                  </div>
                ) : (
                  <Package className="w-32 h-32" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              <div className="w-full md:w-1/2 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'الرمز' : 'SKU'}</p>
                    <p className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{selectedProduct.skuPrefix}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'الحالة' : 'Status'}</p>
                    <Badge className={statusColors[selectedProduct.status]}>
                      {t[selectedProduct.status as keyof typeof t] || selectedProduct.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'الفئة' : 'Category'}</p>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedProduct.category?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'الحالة FDA' : 'SFDA Status'}</p>
                    <Badge className={selectedProduct.sfdaStatus === 'approved' ? 'bg-[#2D6A4F] text-white' : selectedProduct.sfdaStatus === 'pending' ? 'bg-[#E8A838] text-black' : 'bg-gray-400 text-white'}>
                      {t[selectedProduct.sfdaStatus as keyof typeof t] || selectedProduct.sfdaStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'التكلفة' : 'Base Cost'}</p>
                    <p style={{ color: 'var(--text-primary)' }}>SAR {Number(selectedProduct.baseCost).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'سعر البيع' : 'Retail Price'}</p>
                    <p className="font-semibold" style={{ color: 'var(--accent-gold)' }}>SAR {Number(selectedProduct.baseRetailPrice).toFixed(2)}</p>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'الوصف' : 'Description'}</p>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedProduct.description}</p>
                  </div>
                )}

                {selectedProduct.keyIngredients && (
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'المكونات' : 'Key Ingredients'}</p>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedProduct.keyIngredients}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'خالي من الكافيين' : 'Caffeine-free'}:</span>
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
