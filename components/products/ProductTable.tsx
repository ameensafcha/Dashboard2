'use client';

import { useProductStore } from '@/stores/productStore';
import { useAppStore } from '@/stores/appStore';
import { productStatuses } from '@/app/actions/product/types';
import { Edit, Trash2 } from 'lucide-react';
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

interface ProductTableProps {
  products: any[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-[#2D6A4F] text-white',
  in_development: 'bg-[#E8A838] text-black',
  discontinued: 'bg-[#D32F2F] text-white',
};

const sfdaColors: Record<string, string> = {
  approved: 'bg-[#2D6A4F] text-white',
  pending: 'bg-[#E8A838] text-black',
  not_submitted: 'bg-gray-400 text-white',
};

export default function ProductTable({ products, isLoading }: ProductTableProps) {
  const { setSelectedProduct, setModalOpen, setProductToDelete, setDeleteModalOpen } = useProductStore();
  const { isRTL } = useAppStore();

  const handleEdit = (product: any) => {
    setSelectedProduct(product.id);
    setModalOpen(true);
  };

  const handleDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">{isRTL ? 'اسم المنتج' : 'Product Name'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'الفئة' : 'Category'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'الرمز' : 'SKU'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'التكلفة' : 'Cost'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'السعر' : 'Price'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'الصفة FDA' : 'SFDA'}</TableHead>
              <TableHead className="text-right font-semibold">{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">{isRTL ? 'اسم المنتج' : 'Product Name'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'الفئة' : 'Category'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'الرمز' : 'SKU'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'التكلفة' : 'Cost'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'السعر' : 'Price'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="font-semibold">{isRTL ? 'الصفة FDA' : 'SFDA'}</TableHead>
              <TableHead className="text-right font-semibold">{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                {isRTL ? 'لا توجد منتجات' : 'No products found'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">{isRTL ? 'اسم المنتج' : 'Product Name'}</TableHead>
            <TableHead className="font-semibold">{isRTL ? 'الفئة' : 'Category'}</TableHead>
            <TableHead className="font-semibold">{isRTL ? 'الرمز' : 'SKU'}</TableHead>
            <TableHead className="font-semibold">{isRTL ? 'التكلفة' : 'Cost'}</TableHead>
            <TableHead className="font-semibold">{isRTL ? 'السعر' : 'Price'}</TableHead>
            <TableHead className="font-semibold">{isRTL ? 'الحالة' : 'Status'}</TableHead>
            <TableHead className="font-semibold">{isRTL ? 'الصفة FDA' : 'SFDA'}</TableHead>
            <TableHead className="text-right font-semibold">{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.category?.name || '-'}</TableCell>
              <TableCell className="font-mono text-sm">{product.skuPrefix}</TableCell>
              <TableCell>SAR {Number(product.baseCost).toFixed(2)}</TableCell>
              <TableCell>SAR {Number(product.baseRetailPrice).toFixed(2)}</TableCell>
              <TableCell>
                <Badge className={statusColors[product.status]}>
                  {productStatuses.find(s => s.value === product.status)?.label}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={sfdaColors[product.sfdaStatus]}>
                  {product.sfdaStatus === 'approved' ? '✓' : product.sfdaStatus === 'pending' ? '⏳' : '—'} {product.sfdaStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-gray-600 hover:text-[#E8A838] hover:bg-amber-50 rounded-lg transition-colors"
                    title={isRTL ? 'تعديل' : 'Edit'}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-gray-600 hover:text-[#D32F2F] hover:bg-red-50 rounded-lg transition-colors"
                    title={isRTL ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
