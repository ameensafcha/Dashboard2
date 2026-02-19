'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/stores/productStore';
import { getProduct, createProduct, updateProduct } from '@/app/actions/product/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ProductForm from './ProductForm';
import { toast } from '@/components/ui/toast';

export default function ProductModal() {
  const { isModalOpen, setModalOpen, selectedProduct, setSelectedProduct } = useProductStore();
  
  const [formData, setFormData] = useState<any>({
    name: '',
    productId: '',
    categoryId: '',
    status: 'active',
    baseCost: 0,
    baseRetailPrice: 0,
    sfdaStatus: 'not_submitted',
    sfdaReference: '',
    description: '',
    keyIngredients: '',
    caffeineFree: true,
    image: null,
    launchDate: null,
  });

  const [originalData, setOriginalData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isModalOpen && selectedProduct) {
      loadProduct(selectedProduct);
    } else if (isModalOpen && !selectedProduct) {
      resetForm();
    }
  }, [isModalOpen, selectedProduct]);

  const loadProduct = async (id: string) => {
    const product = await getProduct(id);
    if (product) {
      const productId = product.skuPrefix ? product.skuPrefix.replace('PRD-', '') : '';
      const data = {
        ...product,
        categoryId: product.categoryId || '',
        productId,
      };
      setFormData(data);
      setOriginalData(data);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      productId: '',
      categoryId: '',
      status: 'active',
      baseCost: 0,
      baseRetailPrice: 0,
      sfdaStatus: 'not_submitted',
      sfdaReference: '',
      description: '',
      keyIngredients: '',
      caffeineFree: true,
      image: null,
      launchDate: null,
    });
    setOriginalData(null);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedProduct(null);
    resetForm();
  };

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const hasChanges = (): boolean => {
    if (!originalData) return true;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'Please enter product name', type: 'error' });
      return;
    }

    const dataToSave = {
      ...formData,
      skuPrefix: formData.skuPrefix || undefined,
    };

    setIsSaving(true);
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct, dataToSave);
        toast({ title: 'Success', description: 'Product updated successfully', type: 'success' });
        await loadProduct(selectedProduct);
        window.dispatchEvent(new Event('refresh-products'));
      } else {
        await createProduct(dataToSave);
        toast({ title: 'Success', description: 'Product created successfully', type: 'success' });
        window.dispatchEvent(new Event('refresh-products'));
        handleClose();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: 'Error', description: 'Failed to save product', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>
        
        <ProductForm product={formData} onChange={handleFieldChange} />
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.name}
            className="bg-[#E8A838] hover:bg-[#d49a2d] text-black"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
