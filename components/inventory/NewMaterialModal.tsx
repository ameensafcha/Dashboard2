'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { createRawMaterial } from '@/app/actions/inventory/raw-materials';
import { createSupplier } from '@/app/actions/suppliers-create';

interface NewMaterialModalProps {
    onSuccess: () => void;
    suppliers: { id: string; name: string }[];
}

export default function NewMaterialModal({ onSuccess, suppliers: initialSuppliers }: NewMaterialModalProps) {
    const { t, isRTL } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Inline supplier creation
    const [supplierList, setSupplierList] = useState(initialSuppliers);
    const [isAddingSupplier, setIsAddingSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [isSavingSupplier, setIsSavingSupplier] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        skuNumber: '',
        category: 'BASE_POWDER',
        currentStock: 0,
        unitCost: 0,
        reorderThreshold: 0,
        reorderQuantity: 0,
        location: 'AL_AHSA_WAREHOUSE',
        supplierId: 'none'
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleQuickAddSupplier = async () => {
        if (!newSupplierName.trim()) return;
        setIsSavingSupplier(true);
        const result = await createSupplier({ name: newSupplierName.trim() });
        setIsSavingSupplier(false);
        if (result.success && result.id) {
            const newSup = { id: result.id, name: newSupplierName.trim() };
            setSupplierList(prev => [...prev, newSup]);
            handleChange('supplierId', result.id);
            setNewSupplierName('');
            setIsAddingSupplier(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.skuNumber) {
            setError('Name and SKU Number are required.');
            return;
        }

        setIsSaving(true);
        setError(null);

        const result = await createRawMaterial({
            name: formData.name,
            skuNumber: formData.skuNumber,
            category: formData.category as any,
            currentStock: formData.currentStock,
            unitCost: formData.unitCost,
            reorderThreshold: formData.reorderThreshold || undefined,
            reorderQuantity: formData.reorderQuantity || undefined,
            location: formData.location as any,
            supplierId: formData.supplierId === 'none' ? undefined : formData.supplierId,
        });

        setIsSaving(false);

        if (result.success) {
            setIsOpen(false);
            setFormData({
                name: '',
                skuNumber: '',
                category: 'BASE_POWDER',
                currentStock: 0,
                unitCost: 0,
                reorderThreshold: 0,
                reorderQuantity: 0,
                location: 'AL_AHSA_WAREHOUSE',
                supplierId: 'none'
            });
            onSuccess();
        } else {
            setError(result.error || 'Failed to create raw material');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
                    <Plus className="mr-2 h-4 w-4" />
                    New Material
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[var(--text-primary)]">Add New Raw Material</DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)]">
                        Enter the details for a new raw material to track in inventory.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <div className="grid gap-4 py-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label>Material Name <span className="text-red-500">*</span></Label>
                        <Input
                            placeholder="e.g. Palm Leaf Powder"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="bg-[var(--background)] border-[var(--border)]"
                        />
                    </div>

                    {/* SKU */}
                    <div className="space-y-2">
                        <Label>SKU Number <span className="text-red-500">*</span></Label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] text-sm">
                                sku-
                            </span>
                            <Input
                                placeholder="001"
                                value={formData.skuNumber}
                                onChange={(e) => handleChange('skuNumber', e.target.value)}
                                className="rounded-l-none bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                    </div>

                    {/* Category + Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={formData.category} onValueChange={(val) => handleChange('category', val)}>
                                <SelectTrigger className="bg-[var(--background)] border-[var(--border)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[105]">
                                    <SelectItem value="BASE_POWDER">Base Powder</SelectItem>
                                    <SelectItem value="FLAVORING">Flavoring</SelectItem>
                                    <SelectItem value="PACKAGING">Packaging</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Select value={formData.location} onValueChange={(val) => handleChange('location', val)}>
                                <SelectTrigger className="bg-[var(--background)] border-[var(--border)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[105]">
                                    <SelectItem value="AL_AHSA_WAREHOUSE">Al-Ahsa Warehouse</SelectItem>
                                    <SelectItem value="KHOBAR_OFFICE">Khobar Office</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Supplier with inline add */}
                    <div className="space-y-2">
                        <Label>Supplier</Label>
                        {isAddingSupplier ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="New supplier name..."
                                    value={newSupplierName}
                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                    className="bg-[var(--background)] border-[var(--border)] flex-1"
                                    autoFocus
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 whitespace-nowrap"
                                    disabled={!newSupplierName.trim() || isSavingSupplier}
                                    onClick={handleQuickAddSupplier}
                                >
                                    {isSavingSupplier ? '...' : 'Save'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setIsAddingSupplier(false); setNewSupplierName(''); }}
                                >
                                    ✕
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Select value={formData.supplierId} onValueChange={(val) => handleChange('supplierId', val)}>
                                        <SelectTrigger className="bg-[var(--background)] border-[var(--border)]">
                                            <SelectValue placeholder="Select Supplier" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[105]">
                                            <SelectItem value="none">None</SelectItem>
                                            {supplierList.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 border-[var(--border)]"
                                    onClick={() => setIsAddingSupplier(true)}
                                    title="Add new supplier"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stock + Cost */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Initial Stock (kg/units)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={formData.currentStock}
                                onChange={(e) => handleChange('currentStock', parseFloat(e.target.value) || 0)}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
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
                    </div>

                    {/* Reorder thresholds */}
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
                            <Label>Reorder Quantity</Label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={formData.reorderQuantity}
                                onChange={(e) => handleChange('reorderQuantity', parseFloat(e.target.value) || 0)}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Material'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
