'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProductStore } from '@/stores/productStore';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/lib/i18n';
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
import ProductViewModal from './ProductViewModal';
import { Card, CardContent } from '@/components/ui/card';
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

const sfdaStatusColors: Record<string, string> = {
  approved: 'bg-[#2D6A4F] text-white',
  pending: 'bg-[#E8A838] text-black',
  not_submitted: 'bg-[#9E9E9E] text-white',
};

export default function ProductTable({ products, isLoading }: ProductTableProps) {
  const { setSelectedProduct, setModalOpen, setProductToDelete, setDeleteModalOpen, isModalOpen } = useProductStore();
  const { t, isRTL } = useTranslation();
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

  // Variants effect removed

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

  // manage variants handler removed

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--muted)' }}>
              <TableHead className="font-semibold text-[var(--text-primary)]">{t.sku || 'SKU'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)]">{t.productName || 'Product Name'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)] hidden md:table-cell">{t.category || 'Category'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)] text-center hidden sm:table-cell">{t.size || 'Size'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)] hidden sm:table-cell">{t.status || 'Status'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)] hidden lg:table-cell">{t.sfdaStatus || 'SFDA Status'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)] text-right">{t.price || 'Price'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="hidden sm:table-cell text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
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
      <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-[var(--muted)]/20" style={{ borderColor: 'var(--border)' }}>
        <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4 border shadow-inner" style={{ borderColor: 'var(--border)' }}>
          <Package className="w-8 h-8 opacity-40 text-[var(--text-secondary)]" />
        </div>
        <h3 className="text-lg font-semibold mb-1 text-[var(--text-primary)]">{t.noProductsYet || 'No products yet'}</h3>
        <p className="text-sm max-w-xs mx-auto text-[var(--text-secondary)]">{t.addFirstProduct || 'Add your first product to get started'}</p>
        <Button
          onClick={() => setModalOpen(true)}
          variant="outline"
          className="mt-6 border-[#E8A838] text-[#E8A838] hover:bg-[#E8A838]/10"
        >
          {t.addNewProduct || 'Add Product'}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--muted)' }}>
              <TableHead className="font-semibold text-[var(--text-primary)]">{t.sku || 'SKU'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)]">{t.productName || 'Product Name'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)] hidden md:table-cell">{t.category || 'Category'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)] text-center hidden sm:table-cell">{t.size || 'Size'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)] hidden sm:table-cell">{t.status || 'Status'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)] hidden lg:table-cell">{t.sfdaStatus || 'SFDA Status'}</TableHead>
              <TableHead className="font-semibold text-[var(--text-primary)] text-right">{t.price || 'Price'}</TableHead>
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
                <TableCell className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{product.skuPrefix}</TableCell>
                <TableCell className="font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</TableCell>
                <TableCell className="hidden md:table-cell" style={{ color: 'var(--text-primary)' }}>{product.category?.name || '-'}</TableCell>
                <TableCell className="hidden sm:table-cell text-center" style={{ color: 'var(--text-primary)' }}>
                  {product.size ? `${Number(product.size)} ${product.unit || ''}` : '-'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className={statusColors[product.status]}>
                    {productStatuses.find(s => s.value === product.status)?.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge className={sfdaStatusColors[product.sfdaStatus] || 'bg-gray-500'}>
                    {sfdaStatuses.find(s => s.value === product.sfdaStatus)?.label || product.sfdaStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium" style={{ color: 'var(--text-primary)' }}>SAR {Number(product.baseRetailPrice).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Product Detail Modal */}
      <ProductViewModal
        product={selectedProductForModal}
        isOpen={!!selectedProductForModal}
        onClose={handleCloseModal}
        onEdit={(p, e) => handleEdit(p, e)}
        onDelete={(id, e) => {
          handleDelete(id, e);
          handleCloseModal();
        }}
      />
    </>
  );
}
