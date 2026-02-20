'use client';

import { useState, useEffect } from 'react';
import { ProductCategoryType } from '@/app/actions/product/types';
import { getCategories } from '@/app/actions/product/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productStatuses, sfdaStatuses } from '@/app/actions/product/types';

import { Product } from '@prisma/client';

interface ProductFormProps {
  product: Partial<Product> & { productId?: string; categoryId?: string; status?: string; sfdaStatus?: string; caffeineFree?: boolean };
  onChange: (field: string, value: string | number | boolean) => void;
}

export default function ProductForm({ product, onChange }: ProductFormProps) {
  const [categories, setCategories] = useState<ProductCategoryType[]>([]);
  const [openCategory, setOpenCategory] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={product.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Enter product name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="productId">Product ID *</Label>
          <Input
            id="productId"
            type="number"
            value={product.productId || ''}
            onChange={(e) => onChange('productId', e.target.value)}
            placeholder="e.g., 101"
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Label>Category</Label>
          <Select
            open={openCategory}
            onOpenChange={setOpenCategory}
            value={product.categoryId || ''}
            onValueChange={(value) => onChange('categoryId', value)}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent
              className="z-[100] max-h-60 overflow-auto"
              position="popper"
              sideOffset={4}
            >
              {categories.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No categories available</div>
              ) : (
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">
                    {cat.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Label>Status *</Label>
          <Select
            value={product.status || ''}
            onValueChange={(value) => onChange('status', value)}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="z-[100]" position="popper" sideOffset={4}>
              {productStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value} className="cursor-pointer">
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="baseCost">Base Cost (SAR) *</Label>
          <Input
            id="baseCost"
            type="number"
            step="0.01"
            value={product.baseCost ? Number(product.baseCost) : ''}
            onChange={(e) => onChange('baseCost', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="baseRetailPrice">Retail Price (SAR) *</Label>
          <Input
            id="baseRetailPrice"
            type="number"
            step="0.01"
            value={product.baseRetailPrice ? Number(product.baseRetailPrice) : ''}
            onChange={(e) => onChange('baseRetailPrice', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="size">Size *</Label>
          <Input
            id="size"
            type="number"
            step="0.01"
            value={(product as any).size ? Number((product as any).size) : ''}
            onChange={(e) => onChange('size', parseFloat(e.target.value) || 0)}
            placeholder="e.g. 500"
            className="mt-1"
          />
        </div>
        <div className="relative">
          <Label>Unit *</Label>
          <Select
            value={(product as any).unit || 'gm'}
            onValueChange={(value) => onChange('unit', value)}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent className="z-[100]" position="popper" sideOffset={4}>
              <SelectItem value="gm" className="cursor-pointer">gm</SelectItem>
              <SelectItem value="kg" className="cursor-pointer">kg</SelectItem>
              <SelectItem value="ml" className="cursor-pointer">ml</SelectItem>
              <SelectItem value="L" className="cursor-pointer">L</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <Label>SFDA Status</Label>
        <Select
          value={product.sfdaStatus || 'not_submitted'}
          onValueChange={(value) => onChange('sfdaStatus', value)}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="z-[100]" position="popper" sideOffset={4}>
            {sfdaStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value} className="cursor-pointer">
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="sfdaReference">SFDA Reference</Label>
        <Input
          id="sfdaReference"
          value={product.sfdaReference || ''}
          onChange={(e) => onChange('sfdaReference', e.target.value)}
          placeholder="e.g., SFDA-2024-001"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={product.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Enter product description"
          rows={3}
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A838] focus:border-transparent resize-none"
        />
      </div>

      <div>
        <Label htmlFor="keyIngredients">Key Ingredients</Label>
        <Input
          id="keyIngredients"
          value={product.keyIngredients || ''}
          onChange={(e) => onChange('keyIngredients', e.target.value)}
          placeholder="e.g., Natural herbs, spices"
          className="mt-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="caffeineFree"
          checked={product.caffeineFree ?? true}
          onChange={(e) => onChange('caffeineFree', e.target.checked)}
          className="w-4 h-4 text-[#E8A838] border-gray-300 rounded focus:ring-[#E8A838]"
        />
        <Label htmlFor="caffeineFree" className="cursor-pointer">
          Caffeine-free
        </Label>
      </div>
    </div>
  );
}
