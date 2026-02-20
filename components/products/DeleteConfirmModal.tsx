'use client';

import { useProductStore } from '@/stores/productStore';
import { deleteProduct, getProduct } from '@/app/actions/product/actions';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/toast';

export default function DeleteConfirmModal() {
  const { isDeleteModalOpen, setDeleteModalOpen, productToDelete, setProductToDelete } = useProductStore();

  const [productName, setProductName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (productToDelete) {
      loadProductName(productToDelete);
    }
  }, [productToDelete]);

  const loadProductName = async (id: string) => {
    const product = await getProduct(id);
    if (product) {
      setProductName(product.name);
    }
  };

  const handleClose = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
    setProductName('');
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete);
      window.dispatchEvent(new CustomEvent('product-deleted', { detail: { id: productToDelete } }));
      window.dispatchEvent(new Event('refresh-products'));
      handleClose();
      toast({ title: 'Success', description: 'Product deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: 'Error', description: 'Failed to delete product', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isDeleteModalOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{productName}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-[#D32F2F] hover:bg-[#b71c1c] text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
