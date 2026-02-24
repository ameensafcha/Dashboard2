'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { updateFinishedProduct } from '@/app/actions/inventory/finished-products';

interface FinishedProductData {
    id: string;
    productId: string;
    variant: string;
    sku: string;
    currentStock: number;
    reservedStock: number;
    unitCost: number;
    retailPrice: number;
    location: string;
    reorderThreshold: number | null;
    expiryDate: Date | string | null;
    product: { id: string; name: string; skuPrefix: string } | null;
}

interface Props {
    product: FinishedProductData;
    onSuccess: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditFinishedProductModal({ product, onSuccess, open, onOpenChange }: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        variant: product.variant,
        unitCost: product.unitCost,
        retailPrice: product.retailPrice,
        location: product.location,
        reorderThreshold: product.reorderThreshold || 0,
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        const result = await updateFinishedProduct(product.id, {
            ...formData,
            expiryDate: formData.expiryDate || null,
        });
        setIsSaving(false);
        if (result.success) {
            onOpenChange(false);
            onSuccess();
        } else {
            setError(result.error || 'Failed to update.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[var(--text-primary)]">Edit Finished Product</DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)]">
                        Update pricing and storage details for {product.product?.name} ({product.variant}).
                    </DialogDescription>
                </DialogHeader>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">{error}</div>}

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Variant Name</Label>
                            <Input
                                placeholder="e.g. 30g pouch"
                                value={formData.variant}
                                onChange={(e) => handleChange('variant', e.target.value)}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Select value={formData.location} onValueChange={(val) => handleChange('location', val)}>
                                <SelectTrigger className="bg-[var(--background)] border-[var(--border)]"><SelectValue /></SelectTrigger>
                                <SelectContent className="z-[105]">
                                    <SelectItem value="AL_AHSA_WAREHOUSE">Al-Ahsa Warehouse</SelectItem>
                                    <SelectItem value="KHOBAR_OFFICE">Khobar Office</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Unit Cost (SAR)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={formData.unitCost}
                                onChange={(e) => handleChange('unitCost', parseFloat(e.target.value) || 0)}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Retail Price (SAR) <span className="text-[#E8A838] font-bold">*</span></Label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={formData.retailPrice}
                                onChange={(e) => handleChange('retailPrice', parseFloat(e.target.value) || 0)}
                                className="bg-[var(--background)] border-[var(--border)] border-[#E8A838]/50 focus:ring-[#E8A838]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Reorder Threshold</Label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={formData.reorderThreshold}
                                onChange={(e) => handleChange('reorderThreshold', parseFloat(e.target.value) || 0)}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <Input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => handleChange('expiryDate', e.target.value)}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                    <Button className="bg-[#E8A838] text-white hover:bg-[#E8A838]/90" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Updating...' : 'Update Details'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
