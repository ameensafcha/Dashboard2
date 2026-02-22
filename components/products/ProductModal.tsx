'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/stores/productStore';
import { getProduct, createProduct, updateProduct } from '@/app/actions/product/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ProductForm from './ProductForm';
import { toast } from '@/components/ui/toast';
import { Product } from '@prisma/client';
import { Edit, Plus, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

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
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedProduct(null);
    resetForm();
  };

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    setFormData((prev: ProductFormState) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'Please enter product name', type: 'error' });
      return;
    }

    const dataToSave = {
      ...formData,
      skuPrefix: formData.skuPrefix || undefined,
      launchDate: formData.launchDate || null,
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
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden p-0 bg-[var(--background)] border border-[var(--border)] shadow-xl flex flex-col rounded-2xl">
        <DialogHeader className="px-8 py-6 bg-[var(--card)] border-b border-[var(--border)]">
          <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
            <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
              {selectedProduct ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div className={cn("space-y-0.5", isRTL ? "text-right" : "")}>
              <DialogTitle className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                {selectedProduct ? t.editProduct : t.addNewProduct}
              </DialogTitle>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">{selectedProduct ? 'Update product details' : 'Register new catalog item'}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 sm:p-10 scrollbar-hide">
          <ProductForm product={formData as any} onChange={handleFieldChange} />
        </div>

        <div className={cn("flex justify-end gap-3 p-6 bg-[var(--card)] border-t border-[var(--border)]", isRTL ? "flex-row-reverse" : "")}>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSaving}
            className="px-6 text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] h-10 rounded-lg"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.name}
            className="bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] font-bold uppercase tracking-widest text-[10px] h-10 px-8 rounded-lg shadow-sm transition-all active:scale-95"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[var(--primary-foreground)]/30 border-t-[var(--primary-foreground)] rounded-full animate-spin" />
                <span>{selectedProduct ? 'Updating...' : 'Saving...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.saveChanges}</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
