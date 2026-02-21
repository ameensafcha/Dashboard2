'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { createFinishedProduct } from '@/app/actions/inventory/finished-products';

interface Props {
    onSuccess: () => void;
    catalogProducts: { id: string; name: string; skuPrefix: string }[];
}

export default function NewFinishedProductModal({ onSuccess, catalogProducts }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        productId: '',
        variant: '',
        skuNumber: '',
        currentStock: 0,
        reservedStock: 0,
        unitCost: 0,
        retailPrice: 0,
        location: 'AL_AHSA_WAREHOUSE',
        batchNumber: '',
        expiryDate: '',
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSave = async () => {
        if (!formData.productId || !formData.variant || !formData.skuNumber) {
            setError('Product, Variant, and SKU are required.');
            return;
        }
        setIsSaving(true);
        setError(null);
        const result = await createFinishedProduct(formData);
        setIsSaving(false);
        if (result.success) {
            setIsOpen(false);
            setFormData({ productId: '', variant: '', skuNumber: '', currentStock: 0, reservedStock: 0, unitCost: 0, retailPrice: 0, location: 'AL_AHSA_WAREHOUSE', batchNumber: '', expiryDate: '' });
            onSuccess();
        } else {
            setError(result.error || 'Failed to create.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
                    <Plus className="mr-2 h-4 w-4" /> New Finished Product
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[var(--text-primary)]">Add Finished Product</DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)]">Link a finished product variant to an existing catalog product.</DialogDescription>
                </DialogHeader>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">{error}</div>}

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Catalog Product <span className="text-red-500">*</span></Label>
                        <Select value={formData.productId} onValueChange={(val) => handleChange('productId', val)}>
                            <SelectTrigger className="bg-[var(--background)] border-[var(--border)]"><SelectValue placeholder="Select Product" /></SelectTrigger>
                            <SelectContent className="z-[105]">
                                {catalogProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Variant <span className="text-red-500">*</span></Label>
                            <Input placeholder="e.g. 30g pouch" value={formData.variant} onChange={(e) => handleChange('variant', e.target.value)} className="bg-[var(--background)] border-[var(--border)]" />
                        </div>
                        <div className="space-y-2">
                            <Label>SKU Number <span className="text-red-500">*</span></Label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] text-sm">fp-</span>
                                <Input placeholder="001" value={formData.skuNumber} onChange={(e) => handleChange('skuNumber', e.target.value)} className="rounded-l-none bg-[var(--background)] border-[var(--border)]" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Unit Cost (SAR)</Label>
                            <Input type="number" min="0" step="any" value={formData.unitCost} onChange={(e) => handleChange('unitCost', parseFloat(e.target.value) || 0)} className="bg-[var(--background)] border-[var(--border)]" />
                        </div>
                        <div className="space-y-2">
                            <Label>Retail Price (SAR)</Label>
                            <Input type="number" min="0" step="any" value={formData.retailPrice} onChange={(e) => handleChange('retailPrice', parseFloat(e.target.value) || 0)} className="bg-[var(--background)] border-[var(--border)]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Current Stock</Label>
                            <Input type="number" min="0" step="any" value={formData.currentStock} onChange={(e) => handleChange('currentStock', parseFloat(e.target.value) || 0)} className="bg-[var(--background)] border-[var(--border)]" />
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
                            <Label>Batch Number</Label>
                            <Input placeholder="e.g. B-2026-001" value={formData.batchNumber} onChange={(e) => handleChange('batchNumber', e.target.value)} className="bg-[var(--background)] border-[var(--border)]" />
                        </div>
                        <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <Input type="date" value={formData.expiryDate} onChange={(e) => handleChange('expiryDate', e.target.value)} className="bg-[var(--background)] border-[var(--border)]" />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</Button>
                    <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Product'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
