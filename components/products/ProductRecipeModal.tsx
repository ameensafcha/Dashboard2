'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { BookOpen, Plus, Trash2, Loader2, Save, X, Search, DollarSign } from 'lucide-react';
import { ProductsResponse, getProductRecipe, saveProductRecipe } from '@/app/actions/product/actions';
import { getRawMaterials } from '@/app/actions/inventory/raw-materials';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

type ProductType = ProductsResponse['products'][0];

interface ProductRecipeModalProps {
    product: ProductType | null;
    isOpen: boolean;
    onClose: () => void;
}

interface RecipeItem {
    id?: string;
    rawMaterialId: string;
    quantity: number;
}

export default function ProductRecipeModal({ product, isOpen, onClose }: ProductRecipeModalProps) {
    const { t, isRTL } = useTranslation();
    const [items, setItems] = useState<RecipeItem[]>([]);
    const [rawMaterials, setRawMaterials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && product) {
            loadData();
        } else if (!isOpen) {
            setItems([]);
        }
    }, [isOpen, product]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load available raw materials
            const materialsRes = await getRawMaterials();
            if (materialsRes.success && 'materials' in materialsRes) {
                setRawMaterials(materialsRes.materials);
            }

            // Load existing recipe
            const recipe = await getProductRecipe(product!.id);
            setItems(recipe.map((r: any) => ({
                id: r.id,
                rawMaterialId: r.rawMaterialId,
                quantity: typeof r.quantity === 'string' ? parseFloat(r.quantity) : Number(r.quantity),
            })));
        } catch (error) {
            console.error('Failed to load recipe data:', error);
            toast({ title: 'Error', description: 'Failed to load recipe data', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = () => {
        setItems([...items, { rawMaterialId: '', quantity: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof RecipeItem, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value || '';
        setItems(newItems);
    };

    const handleSave = async () => {
        if (!product) return;

        // Validate
        const hasEmpty = items.some(i => !i.rawMaterialId || i.quantity <= 0);
        if (hasEmpty) {
            toast({ title: 'Validation Error', description: 'All items must have a material and quantity > 0', type: 'error' });
            return;
        }

        // Check duplicates
        const materialIds = items.map(i => i.rawMaterialId);
        if (new Set(materialIds).size !== materialIds.length) {
            toast({ title: 'Validation Error', description: 'Duplicate raw materials are not allowed in the recipe', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const payload = items.map(i => ({ rawMaterialId: i.rawMaterialId, quantity: i.quantity }));
            const result = await saveProductRecipe(product.id, payload);

            if (result.success) {
                toast({ title: 'Success', description: 'Recipe saved successfully', type: 'success' });
                window.dispatchEvent(new Event('refresh-products'));
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to save recipe', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const calculateTotalMaterialCost = () => {
        return items.reduce((total, item) => {
            const mat = rawMaterials.find(m => m.id === item.rawMaterialId);
            const unitCost = mat ? Number(mat.unitCost) : 0;
            return total + (item.quantity * unitCost);
        }, 0);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 border-[var(--border)] shadow-xl rounded-2xl bg-[var(--background)]">
                <DialogHeader className="px-6 py-5 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-10">
                    <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div className={cn("space-y-1", isRTL ? "text-right" : "")}>
                            <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">
                                {product?.name} - {isRTL ? 'وصفة التكلفة' : 'Cost Recipe (BOM)'}
                            </DialogTitle>
                            <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                {isRTL ? 'إدارة المواد الخام' : 'Manage Raw Materials Bill of Materials'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* Recipe Items List */}
                            <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
                                <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/50 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                                        {isRTL ? 'المواد' : 'Materials'}
                                    </h3>
                                    <Button
                                        size="sm"
                                        onClick={handleAddItem}
                                        variant="outline"
                                        disabled={items.length >= rawMaterials.length}
                                        className="h-8 border-[#E8A838] text-[#E8A838] hover:bg-[#E8A838]/10 text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        {isRTL ? 'إضافة مادة' : 'Add Material'}
                                    </Button>
                                </div>

                                <div className="p-4 space-y-4">
                                    {items.length === 0 ? (
                                        <div className="text-center py-10 text-[var(--text-muted)]">
                                            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-medium">{isRTL ? 'لا توجد مواد مضافة' : 'No materials added yet'}</p>
                                            <p className="text-xs mt-1">Add raw materials to automatically calculate product cost.</p>
                                        </div>
                                    ) : (
                                        items.map((item, index) => {
                                            const selectedMat = rawMaterials.find(m => m.id === item.rawMaterialId);
                                            const unitCost = selectedMat ? Number(selectedMat.unitCost) : 0;
                                            const lineTotal = unitCost * item.quantity;

                                            return (
                                                <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 items-end">
                                                    <div className={cn("flex-1 space-y-2", isRTL ? "text-right" : "")}>
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Raw Material</Label>
                                                        <Select
                                                            value={item.rawMaterialId || undefined}
                                                            onValueChange={(val) => handleItemChange(index, 'rawMaterialId', val)}
                                                        >
                                                            <SelectTrigger className="bg-[var(--background)] border-[var(--border)] h-10">
                                                                <SelectValue placeholder="Select Material" />
                                                            </SelectTrigger>
                                                            <SelectContent className="z-[100] bg-[var(--card)] border-[var(--border)]">
                                                                {rawMaterials
                                                                    .filter(rm => !items.some((i, idx) => i.rawMaterialId === rm.id && idx !== index))
                                                                    .map(rm => (
                                                                        <SelectItem key={rm.id} value={rm.id} className="text-[var(--text-primary)] focus:bg-[var(--muted)] focus:text-[var(--text-primary)]">
                                                                            {rm.name} (SAR {Number(rm.unitCost).toFixed(2)} / kg)
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className={cn("w-full sm:w-32 space-y-2", isRTL ? "text-right" : "")}>
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                                            Quantity (gm)
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.quantity > 0 ? (item.quantity * 1000).toString() : ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                handleItemChange(index, 'quantity', val === '' ? 0 : parseFloat(val) / 1000);
                                                            }}
                                                            className="bg-[var(--background)] border-[var(--border)] h-10"
                                                        />
                                                    </div>

                                                    <div className="w-full sm:w-28 space-y-2 text-right">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Line Total</Label>
                                                        <div className="h-10 flex items-center justify-end font-medium text-[var(--primary)] px-3">
                                                            SAR {lineTotal.toFixed(2)}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 mb-0.5"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl p-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">Total Material Cost</span>
                                    <span className="text-2xl font-bold text-[var(--primary)]">SAR {calculateTotalMaterialCost().toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mt-2">
                                    This material cost will be aggregated with Labor, Packaging, and Overhead costs to determine your final Production Cost (COGS) and Margins.
                                </p>
                            </div>

                        </div>
                    )}
                </div>

                <div className={cn("flex justify-end gap-3 p-5 bg-[var(--card)] border-t border-[var(--border)]", isRTL ? "flex-row-reverse" : "")}>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] h-10 rounded-lg"
                    >
                        {t.cancel || 'Close'}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] font-bold uppercase tracking-widest text-[10px] h-10 px-8 rounded-lg shadow-sm transition-all"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Recipe</span>
                            </div>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
