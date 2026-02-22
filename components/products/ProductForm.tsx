'use client';

import { useState, useEffect } from 'react';
import { ProductCategoryType } from '@/app/actions/product/types';
import { getCategories } from '@/app/actions/product/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { Tag, FileText, Hash, DollarSign, Package, Activity, ShieldCheck, Box, Coffee, LayoutGrid, Calendar, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className="space-y-10">
      {/* 1. Core Identity Section */}
      <FormSection
        icon={Package}
        title={isRTL ? 'بيانات المنتج' : 'Core Identity'}
        description={isRTL ? 'الاسم ورمز المنتج' : 'Product identifiers'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <FormItem icon={Hash} label={t.productId} required isRTL={isRTL}>
            <Input
              type="number"
              value={product.productId || ''}
              onChange={(e) => onChange('productId', e.target.value)}
              placeholder="e.g., 101"
              disabled={!!(product as any).id}
              className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </FormItem>
          <FormItem icon={Tag} label={t.productName} required isRTL={isRTL}>
            <Input
              value={product.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder={t.enterProductName}
              className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl focus:ring-1 focus:ring-[var(--primary)]"
            />
          </FormItem>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <FormItem icon={Activity} label={t.status} required isRTL={isRTL}>
            <Select
              value={product.status || ''}
              onValueChange={(value) => onChange('status', value)}
            >
              <SelectTrigger className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl">
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent className="bg-[var(--popover)] border-[var(--border)] shadow-xl rounded-xl">
                {productStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value} className="text-[var(--text-primary)] py-2.5">
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
          <FormItem icon={LayoutGrid} label={t.category} isRTL={isRTL}>
            <Select
              open={openCategory}
              onOpenChange={setOpenCategory}
              value={product.categoryId || ''}
              onValueChange={(value) => onChange('categoryId', value)}
            >
              <SelectTrigger className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl">
                <SelectValue placeholder={t.allCategories} />
              </SelectTrigger>
              <SelectContent className="bg-[var(--popover)] border-[var(--border)] shadow-xl rounded-xl max-h-60 overflow-auto">
                {categories.length === 0 ? (
                  <div className="p-4 text-center text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">{t.noCategoriesYet}</div>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-[var(--text-primary)] py-2.5">
                      {cat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormItem>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 border-t border-[var(--border)]/10 pt-6">
          <FormItem icon={Calendar} label={t.launchDate} isRTL={isRTL}>
            <Input
              type="date"
              value={product.launchDate ? new Date(product.launchDate).toISOString().split('T')[0] : ''}
              onChange={(e) => onChange('launchDate', e.target.value)}
              className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl focus:ring-1 focus:ring-[var(--primary)]"
            />
          </FormItem>
        </div>
      </FormSection>

      {/* 2. Pricing & Economics */}
      <FormSection
        icon={DollarSign}
        title={isRTL ? 'التسعير' : 'Pricing'}
        description={isRTL ? 'التكلفة وسعر السوق' : 'Marginal evaluation'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 bg-[var(--muted)]/30 p-6 rounded-2xl border border-[var(--border)]">
          <FormItem icon={DollarSign} label={t.baseCost} required isRTL={isRTL}>
            <Input
              type="number"
              step="0.01"
              value={product.baseCost ? Number(product.baseCost) : ''}
              onChange={(e) => onChange('baseCost', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="bg-white dark:bg-[var(--card)] border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl font-bold"
            />
          </FormItem>
          <FormItem icon={Tag} label={t.retailPrice} required isRTL={isRTL}>
            <Input
              type="number"
              step="0.01"
              value={product.baseRetailPrice ? Number(product.baseRetailPrice) : ''}
              onChange={(e) => onChange('baseRetailPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="bg-white dark:bg-[var(--card)] border-[var(--border)] text-[var(--primary)] h-11 rounded-xl font-bold text-lg"
            />
          </FormItem>
        </div>
      </FormSection>

      {/* 3. Specifications */}
      <FormSection
        icon={Box}
        title={isRTL ? 'المواصفات' : 'Specifications'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <FormItem icon={Box} label={t.unit} required isRTL={isRTL}>
            <Select
              value={(product as any).unit || 'gm'}
              onValueChange={(value) => onChange('unit', value)}
            >
              <SelectTrigger className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl">
                <SelectValue placeholder={t.unit} />
              </SelectTrigger>
              <SelectContent className="bg-[var(--popover)] border-[var(--border)] shadow-xl rounded-xl">
                {['gm', 'kg', 'ml', 'L'].map(u => (
                  <SelectItem key={u} value={u} className="text-[var(--text-primary)] py-2.5">{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
          <FormItem icon={Scale} label={t.size} required isRTL={isRTL}>
            <Input
              type="number"
              step="0.01"
              value={(product as any).size ? Number((product as any).size) : ''}
              onChange={(e) => onChange('size', parseFloat(e.target.value) || 0)}
              placeholder="e.g. 500"
              className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl"
            />
          </FormItem>
        </div>

        <div className={cn("flex items-center gap-4 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all cursor-pointer", isRTL ? "flex-row-reverse" : "")}>
          <input
            type="checkbox"
            id="caffeineFree"
            checked={product.caffeineFree ?? true}
            onChange={(e) => onChange('caffeineFree', e.target.checked)}
            className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
          />
          <div className={cn("flex flex-col", isRTL ? "text-right" : "")}>
            <Label htmlFor="caffeineFree" className="cursor-pointer text-sm font-bold text-[var(--text-primary)]">
              {t.caffeineFree}
            </Label>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Zero caffeine content</p>
          </div>
        </div>
      </FormSection>

      {/* 4. Regulatory */}
      <FormSection
        icon={ShieldCheck}
        title={isRTL ? 'المعلومات النظامية' : 'Compliance'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 bg-green-500/5 p-6 rounded-2xl border border-green-500/10 mb-6">
          <FormItem icon={ShieldCheck} label={t.sfdaStatus} isRTL={isRTL}>
            <Select
              value={product.sfdaStatus || 'not_submitted'}
              onValueChange={(value) => onChange('sfdaStatus', value)}
            >
              <SelectTrigger className="bg-white dark:bg-[var(--card)] border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl">
                <SelectValue placeholder={t.sfdaStatus} />
              </SelectTrigger>
              <SelectContent className="bg-[var(--popover)] border-[var(--border)] shadow-xl rounded-xl">
                {sfdaStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value} className="text-[var(--text-primary)] py-2.5">
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
          <FormItem icon={Hash} label={t.sfdaReference} isRTL={isRTL}>
            <Input
              value={product.sfdaReference || ''}
              onChange={(e) => onChange('sfdaReference', e.target.value)}
              placeholder="ID Reference"
              className="bg-white dark:bg-[var(--card)] border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl font-mono uppercase"
            />
          </FormItem>
        </div>

        <div className="space-y-6">
          <FormItem icon={FileText} label={t.keyIngredients} isRTL={isRTL}>
            <Input
              value={product.keyIngredients || ''}
              onChange={(e) => onChange('keyIngredients', e.target.value)}
              placeholder="e.g., Herbs, Spices"
              className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl"
            />
          </FormItem>
          <FormItem icon={FileText} label={t.description} isRTL={isRTL}>
            <textarea
              id="description"
              value={product.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder={t.enterProductDescription}
              rows={3}
              className="w-full px-5 py-3 bg-[var(--muted)]/50 border border-[var(--border)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none text-sm leading-relaxed"
            />
          </FormItem>
        </div>
      </FormSection>
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: any,
  title: string,
  description?: string,
  children: React.ReactNode
}) {
  const { isRTL } = useTranslation();
  return (
    <div className="space-y-5">
      <div className={cn("space-y-1 px-1", isRTL ? "text-right" : "")}>
        <h3 className={cn("text-base font-bold text-[var(--text-primary)] flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
          <Icon className="w-4 h-4 text-[var(--primary)]" />
          {title}
        </h3>
        {description && <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{description}</p>}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

function FormItem({
  icon: Icon,
  label,
  required,
  children,
  isRTL
}: {
  icon: any,
  label: string,
  required?: boolean,
  children: React.ReactNode,
  isRTL: boolean
}) {
  return (
    <div className="space-y-2.5">
      <Label className={cn(
        "text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2",
        isRTL ? "flex-row-reverse" : ""
      )}>
        <Icon className="w-3.5 h-3.5 opacity-40" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}
