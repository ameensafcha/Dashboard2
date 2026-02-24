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
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateRawMaterial, UpdateRawMaterialInput } from '@/app/actions/inventory/raw-materials';
import { createSupplier } from '@/app/actions/suppliers-create';
import { RawMaterialData } from '@/stores/inventoryStore';

interface EditRawMaterialModalProps {
    material: RawMaterialData;
    onSuccess: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    suppliers: { id: string; name: string; isActive: boolean }[];
}

export default function EditRawMaterialModal({ material, onSuccess, open, onOpenChange, suppliers: initialSuppliers }: EditRawMaterialModalProps) {
    const { t, isRTL } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Supplier creation state within the modal
    const [supplierList, setSupplierList] = useState(initialSuppliers);
    const [isAddingSupplier, setIsAddingSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [isSavingSupplier, setIsSavingSupplier] = useState(false);

    // Initialize formData from the existing material
    // Note: SKU is expected as 'sku-001', so we extract '001' for the input
    const initialSkuNumber = material.sku.startsWith('sku-') ? material.sku.replace('sku-', '') : material.sku;

    const [formData, setFormData] = useState({
        name: material.name,
        skuNumber: initialSkuNumber,
        category: material.category,
        currentStock: material.currentStock,
        unitCost: material.unitCost,
        reorderThreshold: material.reorderThreshold || 0,
        reorderQuantity: material.reorderQuantity || 0,
        location: material.location,
        supplierId: material.supplierId || 'none'
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
            const newSup = { id: result.id, name: newSupplierName.trim(), isActive: true };
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

        const updateData: UpdateRawMaterialInput = {
            name: formData.name,
            skuNumber: formData.skuNumber,
            category: formData.category as any,
            currentStock: formData.currentStock,
            unitCost: formData.unitCost,
            reorderThreshold: formData.reorderThreshold || undefined,
            reorderQuantity: formData.reorderQuantity || undefined,
            location: formData.location as any,
            supplierId: formData.supplierId === 'none' ? undefined : formData.supplierId,
        };

        const result = await updateRawMaterial(material.id, updateData);

        setIsSaving(false);

        if (result.success) {
            onOpenChange(false);
            onSuccess();
        } else {
            setError(result.error || 'Failed to update raw material');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg border-[var(--border)] shadow-2xl p-0 overflow-hidden" style={{ background: 'var(--card)' }}>
                <div className="bg-[var(--muted)]/50 p-6 border-b border-[var(--border)]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">{t.editRawMaterial || 'Edit Raw Material'}</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            {(t as any).updateMaterialDetailsMsg || 'Update material specifications and inventory settings.'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {error && (
                    <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="p-6 grid gap-5 overflow-y-auto max-h-[60vh]">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[var(--text-primary)]">{t.materialName} <span className="text-red-500">*</span></Label>
                        <Input
                            placeholder={t.enterMaterialName}
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
                        />
                    </div>

                    {/* SKU */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[var(--text-primary)]">{t.skuNumber} <span className="text-red-500">*</span></Label>
                        <div className={cn("flex", isRTL ? "flex-row-reverse" : "flex-row")}>
                            <span className={cn(
                                "inline-flex items-center px-4 border border-[var(--border)] bg-[var(--muted)] text-[var(--text-secondary)] text-sm font-mono opacity-60",
                                isRTL ? "rounded-r-xl border-l-0" : "rounded-l-xl border-r-0"
                            )}>
                                sku-
                            </span>
                            <Input
                                placeholder="001"
                                value={formData.skuNumber}
                                onChange={(e) => handleChange('skuNumber', e.target.value)}
                                className={cn(
                                    "bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11",
                                    isRTL ? "rounded-r-none rounded-l-xl" : "rounded-l-none rounded-r-xl"
                                )}
                            />
                        </div>
                    </div>

                    {/* Category + Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-[var(--text-primary)]">{t.category}</Label>
                            <Select value={formData.category} onValueChange={(val) => handleChange('category', val)}>
                                <SelectTrigger className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-[#E8A838] h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
                                    <SelectItem value="BASE_POWDER">{t.basePowder}</SelectItem>
                                    <SelectItem value="FLAVORING">{t.flavoring}</SelectItem>
                                    <SelectItem value="PACKAGING">{t.packaging}</SelectItem>
                                    <SelectItem value="OTHER">{t.other}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-[var(--text-primary)]">{t.location}</Label>
                            <Select value={formData.location} onValueChange={(val) => handleChange('location', val)}>
                                <SelectTrigger className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-[#E8A838] h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
                                    <SelectItem value="AL_AHSA_WAREHOUSE">{t.alAhsaWarehouse}</SelectItem>
                                    <SelectItem value="KHOBAR_OFFICE">{t.khobarOffice}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Supplier with inline add */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[var(--text-primary)]">{t.supplier}</Label>
                        {isAddingSupplier ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Supplier name..."
                                    value={newSupplierName}
                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                    className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] flex-1 h-11"
                                    autoFocus
                                />
                                <Button
                                    type="button"
                                    className="bg-[#E8A838] text-black hover:bg-[#d49a2d] h-11 px-4"
                                    disabled={!newSupplierName.trim() || isSavingSupplier}
                                    onClick={handleQuickAddSupplier}
                                >
                                    {isSavingSupplier ? '...' : t.save || 'Save'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-11 w-11 p-0 hover:bg-red-500/10 hover:text-red-500"
                                    onClick={() => { setIsAddingSupplier(false); setNewSupplierName(''); }}
                                >
                                    <Plus className="rotate-45 h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Select value={formData.supplierId} onValueChange={(val) => handleChange('supplierId', val)}>
                                        <SelectTrigger className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-[#E8A838] h-11">
                                            <SelectValue placeholder={t.supplier} />
                                        </SelectTrigger>
                                        <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
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
                                    className="shrink-0 border-[var(--border)] bg-[var(--muted)] hover:bg-[#E8A838]/20 hover:text-[#E8A838] h-11 w-11 p-0"
                                    onClick={() => setIsAddingSupplier(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stock + Cost */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-[var(--text-primary)]">{(t as any).currentStockLevel || 'Current Stock'}</Label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={formData.currentStock}
                                onChange={(e) => handleChange('currentStock', parseFloat(e.target.value) || 0)}
                                className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-[var(--text-primary)]">{t.unitCostSar}</Label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={formData.unitCost}
                                onChange={(e) => handleChange('unitCost', parseFloat(e.target.value) || 0)}
                                className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] h-11"
                            />
                        </div>
                    </div>

                    {/* Reorder thresholds */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-[var(--text-primary)]">{t.reorderThreshold}</Label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={formData.reorderThreshold}
                                onChange={(e) => handleChange('reorderThreshold', parseFloat(e.target.value) || 0)}
                                className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] h-11 opacity-80"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-[var(--text-primary)]">{t.reorderQuantity}</Label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={formData.reorderQuantity}
                                onChange={(e) => handleChange('reorderQuantity', parseFloat(e.target.value) || 0)}
                                className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] h-11 opacity-80"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 border-t border-[var(--border)] gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                        className="flex-1 text-[var(--text-secondary)] hover:bg-[var(--muted)]"
                    >
                        {t.cancel}
                    </Button>
                    <Button
                        className="flex-[2] bg-[#E8A838] hover:bg-[#d49a2d] text-black font-bold h-11 shadow-lg shadow-[#E8A838]/20 transition-all active:scale-95 gap-2"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? '...' : (t as any).updateMaterial || 'Update Material'}
                        <ChevronRight className={cn("w-4 h-4 transition-transform", isRTL ? "rotate-180" : "")} />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
