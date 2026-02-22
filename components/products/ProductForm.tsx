'use client';

import { useState, useEffect } from 'react';
import { ProductCategoryType } from '@/app/actions/product/types';
import { getCategories } from '@/app/actions/product/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { Tag, FileText, Hash, DollarSign, Package, Activity, ShieldCheck, Box } from 'lucide-react';

import { Product } from '@prisma/client';

interface ProductFormProps {
  product: Partial<Product> & { productId?: string; categoryId?: string; status?: string; sfdaStatus?: string; caffeineFree?: boolean };
  onChange: (field: string, value: string | number | boolean) => void;
}

export default function ProductForm({ product, onChange }: ProductFormProps) {
  const { t, isRTL } = useTranslation();
  const [categories, setCategories] = useState<ProductCategoryType[]>([]);
  const [openCategory, setOpenCategory] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const productStatusOptions = [
    { value: 'active', label: t.active },
    { value: 'in_development', label: t.in_development },
    { value: 'discontinued', label: t.discontinued },
  ];

  const sfdaStatusOptions = [
    { value: 'approved', label: t.approved },
    { value: 'pending', label: t.pending },
    { value: 'not_submitted', label: t.not_submitted },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="productId" className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            <Hash className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
            {t.productId} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="productId"
            type="number"
            value={product.productId || ''}
            onChange={(e) => onChange('productId', e.target.value)}
            placeholder="e.g., 101"
            className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            <Package className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
            {t.productName} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={product.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder={t.enterProductName}
            className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 relative">
          <Label className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            <Activity className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
            {t.status} <span className="text-red-500">*</span>
          </Label>
          <Select
            value={product.status || ''}
            onValueChange={(value) => onChange('status', value)}
          >
            <SelectTrigger className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11">
              <SelectValue placeholder={t.status} />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-[var(--card)] border-[var(--border)]" position="popper" sideOffset={4}>
              {productStatusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value} className="cursor-pointer text-[var(--text-primary)] hover:bg-[var(--muted)]">
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 relative">
          <Label className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            <Tag className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
            {t.category}
          </Label>
          <Select
            open={openCategory}
            onOpenChange={setOpenCategory}
            value={product.categoryId || ''}
            onValueChange={(value) => onChange('categoryId', value)}
          >
            <SelectTrigger className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11">
              <SelectValue placeholder={t.allCategories} />
            </SelectTrigger>
            <SelectContent
              className="z-[100] max-h-60 overflow-auto bg-[var(--card)] border-[var(--border)]"
              position="popper"
              sideOffset={4}
            >
              {categories.length === 0 ? (
                <div className="p-2 text-sm text-[var(--text-secondary)]">{t.noCategoriesYet}</div>
              ) : (
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="cursor-pointer text-[var(--text-primary)] hover:bg-[var(--muted)]">
                    {cat.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="baseRetailPrice" className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            <DollarSign className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
            {t.retailPrice} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="baseRetailPrice"
            type="number"
            step="0.01"
            value={product.baseRetailPrice ? Number(product.baseRetailPrice) : ''}
            onChange={(e) => onChange('baseRetailPrice', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseCost" className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            <DollarSign className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
            {t.baseCost} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="baseCost"
            type="number"
            step="0.01"
            value={product.baseCost ? Number(product.baseCost) : ''}
            onChange={(e) => onChange('baseCost', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 relative">
          <Label className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            <Box className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
            {t.unit} <span className="text-red-500">*</span>
          </Label>
          <Select
            value={(product as any).unit || 'gm'}
            onValueChange={(value) => onChange('unit', value)}
          >
            <SelectTrigger className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11">
              <SelectValue placeholder={t.unit} />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-[var(--card)] border-[var(--border)]" position="popper" sideOffset={4}>
              {['gm', 'kg', 'ml', 'L'].map(u => (
                <SelectItem key={u} value={u} className="cursor-pointer text-[var(--text-primary)] hover:bg-[var(--muted)]">{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="size" className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            <Box className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
            {t.size} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="size"
            type="number"
            step="0.01"
            value={(product as any).size ? Number((product as any).size) : ''}
            onChange={(e) => onChange('size', parseFloat(e.target.value) || 0)}
            placeholder="e.g. 500"
            className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
          />
        </div>
      </div>

      <div className="space-y-2 relative">
        <Label className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
          <ShieldCheck className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
          {t.sfdaStatus}
        </Label>
        <Select
          value={product.sfdaStatus || 'not_submitted'}
          onValueChange={(value) => onChange('sfdaStatus', value)}
        >
          <SelectTrigger className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11">
            <SelectValue placeholder={t.sfdaStatus} />
          </SelectTrigger>
          <SelectContent className="z-[100] bg-[var(--card)] border-[var(--border)]" position="popper" sideOffset={4}>
            {sfdaStatusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value} className="cursor-pointer text-[var(--text-primary)] hover:bg-[var(--muted)]">
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sfdaReference" className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
          <FileText className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
          {t.sfdaReference}
        </Label>
        <Input
          id="sfdaReference"
          value={product.sfdaReference || ''}
          onChange={(e) => onChange('sfdaReference', e.target.value)}
          placeholder="e.g., SFDA-2024-001"
          className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
          <FileText className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
          {t.description}
        </Label>
        <textarea
          id="description"
          value={product.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder={t.enterProductDescription}
          rows={3}
          className="w-full px-3 py-2 bg-[var(--muted)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] resize-none transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="keyIngredients" className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
          <FileText className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
          {t.keyIngredients}
        </Label>
        <Input
          id="keyIngredients"
          value={product.keyIngredients || ''}
          onChange={(e) => onChange('keyIngredients', e.target.value)}
          placeholder="e.g., Natural herbs, spices"
          className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
        />
      </div>

      <div className="flex items-center gap-2 group cursor-pointer">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="caffeineFree"
            checked={product.caffeineFree ?? true}
            onChange={(e) => onChange('caffeineFree', e.target.checked)}
            className="w-5 h-5 appearance-none border-2 border-[var(--border)] rounded bg-[var(--muted)] checked:bg-[#E8A838] checked:border-[#E8A838] transition-all cursor-pointer focus:ring-2 focus:ring-[#E8A838]/20"
          />
          {product.caffeineFree && (
            <svg className="absolute w-3.5 h-3.5 text-black pointer-events-none inset-0 m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <Label htmlFor="caffeineFree" className="cursor-pointer text-sm font-medium text-[var(--text-primary)] select-none">
          {t.caffeineFree}
        </Label>
      </div>
    </div>
  );
}
