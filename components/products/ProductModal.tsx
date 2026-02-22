'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/stores/productStore';
import { getProduct, createProduct, updateProduct } from '@/app/actions/product/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ProductForm from './ProductForm';
import { toast } from '@/components/ui/toast';
import { Product } from '@prisma/client';

type ProductFormState = Partial<Omit<Product, 'baseCost' | 'baseRetailPrice' | 'size'>> & {
  baseCost: number;
  baseRetailPrice: number;
  size?: number | null;
  unit?: string | null;
  productId?: string;
  categoryId?: string;
  status?: string;
  sfdaStatus?: string;
  caffeineFree?: boolean;
};

export default function ProductModal() {
  const { t, isRTL } = useTranslation();
  const { isModalOpen, setModalOpen, selectedProduct, setSelectedProduct } = useProductStore();

  const [formData, setFormData] = useState<ProductFormState>({
    name: '',
    productId: '',
    categoryId: '',
    status: 'active',
    baseCost: 0,
    baseRetailPrice: 0,
    size: null,
    unit: 'gm',
    sfdaStatus: 'not_submitted',
    sfdaReference: '',
    description: '',
    keyIngredients: '',
    caffeineFree: true,
    image: null,
    launchDate: null,
  });

  const [originalData, setOriginalData] = useState<ProductFormState | null>(null);
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
        baseCost: typeof product.baseCost === 'string' ? parseFloat(product.baseCost) : product.baseCost,
        baseRetailPrice: typeof product.baseRetailPrice === 'string' ? parseFloat(product.baseRetailPrice) : product.baseRetailPrice,
        size: product.size ? (typeof product.size === 'string' ? parseFloat(product.size) : product.size) : null,
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
      size: null,
      unit: 'gm',
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
    setFormData((prev: ProductFormState) => ({ ...prev, [field]: value }));
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
        await updateProduct(selectedProduct, dataToSave as unknown as Partial<Product>);
        toast({ title: 'Success', description: 'Product updated successfully', type: 'success' });
        window.dispatchEvent(new Event('refresh-products'));
        handleClose();
      } else {
        await createProduct(dataToSave as unknown as Partial<Product>);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-[var(--card)] border-[var(--border)] shadow-2xl flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8A838]/10 flex items-center justify-center text-[#E8A838] border border-[#E8A838]/20 shadow-sm">
              {selectedProduct ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <DialogTitle className="text-2xl font-bold text-[var(--text-primary)]">
              {selectedProduct ? t.editProduct : t.addNewProduct}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ProductForm product={formData as any} onChange={handleFieldChange} />
        </div>

        <div className="flex justify-end gap-3 p-6 bg-[var(--muted)]/50 border-t" style={{ borderColor: 'var(--border)' }}>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="border-[var(--border)] hover:bg-[var(--card)] w-28 text-[var(--text-primary)] transition-all"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.name}
            className="bg-[#E8A838] hover:bg-[#d49a2d] text-black font-semibold px-10 shadow-md transition-all active:scale-95"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {selectedProduct ? 'Updating...' : 'Saving...'}
              </div>
            ) : t.saveChanges}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Edit, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
