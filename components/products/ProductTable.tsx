'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProductStore } from '@/stores/productStore';
import { useAppStore } from '@/stores/appStore';
import { productStatuses, sfdaStatuses } from '@/app/actions/product/types';
import { Edit, Trash2, Package, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getProduct, ProductsResponse } from '@/app/actions/product/actions';

type ProductType = ProductsResponse['products'][0];

interface ProductTableProps {
  products: ProductType[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-[#2D6A4F] text-white',
  in_development: 'bg-[#E8A838] text-black',
  discontinued: 'bg-[#D32F2F] text-white',
};

export default function ProductTable({ products, isLoading }: ProductTableProps) {
  const { setSelectedProduct, setModalOpen, setProductToDelete, setDeleteModalOpen, isModalOpen } = useProductStore();
  const { isRTL } = useAppStore();
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductType | null>(null);

  useEffect(() => {
    const handleRefresh = async () => {
      if (selectedProductForModal?.id) {
        const updated = await getProduct(selectedProductForModal.id);
        if (updated) {
          setSelectedProductForModal(updated);
        }
      }
    };
    handleRefresh();

    const handleDeleted = (e: CustomEvent<{ id: string }>) => {
      if (selectedProductForModal?.id === e.detail.id) {
        setSelectedProductForModal(null);
      }
    };
    window.addEventListener('product-deleted', handleDeleted as EventListener);
    return () => window.removeEventListener('product-deleted', handleDeleted as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const handleRowClick = (product: ProductType) => {
    setSelectedProductForModal(product);
  };

  const handleCloseModal = () => {
    setSelectedProductForModal(null);
  };

  const handleEdit = (product: ProductType, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProduct(product.id);
    setModalOpen(true);
  };

  const handleDelete = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--muted)' }}>
              <TableHead className="font-semibold">{isRTL ? 'الرمز' : 'SKU'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'اسم المنتج' : 'Product Name'}</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">{isRTL ? 'الفئة' : 'Category'}</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">{isRTL ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="font-semibold text-right">{isRTL ? 'السعر' : 'Price'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--muted)' }}>
              <TableHead className="font-semibold">{isRTL ? 'الرمز' : 'SKU'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'اسم المنتج' : 'Product Name'}</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">{isRTL ? 'الفئة' : 'Category'}</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">{isRTL ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="font-semibold text-right">{isRTL ? 'السعر' : 'Price'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                {isRTL ? 'لا توجد منتجات' : 'No products found'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--muted)' }}>
              <TableHead className="font-semibold">{isRTL ? 'الرمز' : 'SKU'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'اسم المنتج' : 'Product Name'}</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">{isRTL ? 'الفئة' : 'Category'}</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">{isRTL ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="font-semibold text-right">{isRTL ? 'السعر' : 'Price'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                style={{ background: 'var(--card)', cursor: 'pointer' }}
                onClick={() => handleRowClick(product)}
                className="hover:bg-[var(--muted)] transition-colors"
              >
                <TableCell className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>{product.skuPrefix}</TableCell>
                <TableCell className="font-medium" style={{ color: 'var(--foreground)' }}>{product.name}</TableCell>
                <TableCell className="hidden md:table-cell" style={{ color: 'var(--foreground)' }}>{product.category?.name || '-'}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className={statusColors[product.status]}>
                    {productStatuses.find(s => s.value === product.status)?.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" style={{ color: 'var(--foreground)' }}>SAR {Number(product.baseRetailPrice).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Product Detail Modal */}
      {selectedProductForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
          />
          <div
            className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl"
            style={{ background: 'var(--card)' }}
          >
            {/* Header with Edit/Delete */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{selectedProductForModal.name}</h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={(e) => handleEdit(selectedProductForModal, e)}
                  className="bg-[#E8A838] hover:bg-[#d49a2d] text-black gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {isRTL ? 'تعديل' : 'Edit'}
                </Button>
                <Button
                  onClick={(e) => handleDelete(selectedProductForModal.id, e)}
                  variant="destructive"
                  className="bg-[#D32F2F] hover:bg-[#b71c1c] text-white gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isRTL ? 'حذف' : 'Delete'}
                </Button>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - Image left, Details right */}
            <div className="flex flex-col md:flex-row max-h-[calc(90vh-80px)] overflow-y-auto">
              {/* Left - Image */}
              <div className="w-full md:w-1/2 p-6 flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                {selectedProductForModal.image ? (
                  <div className="relative w-full h-64">
                    <Image
                      src={selectedProductForModal.image}
                      alt={selectedProductForModal.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <Package className="w-32 h-32" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              {/* Right - Details */}
              <div className="w-full md:w-1/2 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الرمز' : 'SKU'}</p>
                    <p className="font-mono font-medium" style={{ color: 'var(--foreground)' }}>{selectedProductForModal.skuPrefix}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الحالة' : 'Status'}</p>
                    <Badge className={statusColors[selectedProductForModal.status]}>
                      {productStatuses.find(s => s.value === selectedProductForModal.status)?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الفئة' : 'Category'}</p>
                    <p style={{ color: 'var(--foreground)' }}>{selectedProductForModal.category?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الحالة FDA' : 'SFDA Status'}</p>
                    <Badge className={selectedProductForModal.sfdaStatus === 'approved' ? 'bg-[#2D6A4F] text-white' : selectedProductForModal.sfdaStatus === 'pending' ? 'bg-[#E8A838] text-black' : 'bg-gray-400 text-white'}>
                      {sfdaStatuses.find(s => s.value === selectedProductForModal.sfdaStatus)?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'التكلفة' : 'Base Cost'}</p>
                    <p style={{ color: 'var(--foreground)' }}>SAR {Number(selectedProductForModal.baseCost).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'سعر البيع' : 'Retail Price'}</p>
                    <p className="font-semibold" style={{ color: 'var(--accent-gold)' }}>SAR {Number(selectedProductForModal.baseRetailPrice).toFixed(2)}</p>
                  </div>
                </div>

                {selectedProductForModal.description && (
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الوصف' : 'Description'}</p>
                    <p style={{ color: 'var(--foreground)' }}>{selectedProductForModal.description}</p>
                  </div>
                )}

                {selectedProductForModal.keyIngredients && (
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'المكونات' : 'Key Ingredients'}</p>
                    <p style={{ color: 'var(--foreground)' }}>{selectedProductForModal.keyIngredients}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'خالي من الكافيين' : 'Caffeine-free'}:</span>
                  <Badge className={selectedProductForModal.caffeineFree ? 'bg-[#2D6A4F] text-white' : 'bg-gray-400 text-white'}>
                    {selectedProductForModal.caffeineFree ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}
                  </Badge>
                </div>

                {selectedProductForModal.sfdaReference && (
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRTL ? 'المرجع FDA' : 'SFDA Reference'}</p>
                    <p style={{ color: 'var(--foreground)' }}>{selectedProductForModal.sfdaReference}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
