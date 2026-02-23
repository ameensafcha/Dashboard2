'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowDownUp } from 'lucide-react';
import { StockMovementType, StockMovementReason } from '@prisma/client';
import { logMovement } from '@/app/actions/inventory/stock-movements';

interface Props {
    targetType: 'raw' | 'finished';
    targetId: string;
    targetName: string;
    onSuccess: () => void;
}

export default function LogMovementModal({ targetType, targetId, targetName, onSuccess }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        type: 'STOCK_IN' as StockMovementType,
        quantity: 0,
        reason: 'PURCHASE' as StockMovementReason,
        notes: '',
        referenceId: '',
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSave = async () => {
        if (!formData.quantity || formData.quantity <= 0) {
            setError('Quantity must be greater than 0.');
            return;
        }
        setIsSaving(true);
        setError(null);

        const result = await logMovement({
            type: formData.type,
            quantity: formData.quantity,
            reason: formData.reason,
            notes: formData.notes || undefined,
            referenceId: formData.referenceId || undefined,
            rawMaterialId: targetType === 'raw' ? targetId : undefined,
            finishedProductId: targetType === 'finished' ? targetId : undefined,
        });

        setIsSaving(false);
        if (result.success) {
            setIsOpen(false);
            setFormData({ type: 'STOCK_IN' as StockMovementType, quantity: 0, reason: 'PURCHASE' as StockMovementReason, notes: '', referenceId: '' });
            onSuccess();
        } else {
            setError(result.error || 'Failed to log movement.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-[var(--text-muted)] hover:text-[var(--primary)]" title="Adjust Stock">
                    <ArrowDownUp className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[var(--text-primary)]">Log Stock Movement</DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)]">
                        Adjust stock for <strong>{targetName}</strong>
                    </DialogDescription>
                </DialogHeader>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">{error}</div>}

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Movement Type</Label>
                            <Select value={formData.type} onValueChange={(val) => handleChange('type', val)}>
                                <SelectTrigger className="bg-[var(--background)] border-[var(--border)]"><SelectValue /></SelectTrigger>
                                <SelectContent className="z-[105]">
                                    <SelectItem value="STOCK_IN">Stock In (+)</SelectItem>
                                    <SelectItem value="STOCK_OUT">Stock Out (−)</SelectItem>
                                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                                    <SelectItem value="RETURN">Return (+)</SelectItem>
                                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min="0.001"
                                step="any"
                                value={formData.quantity}
                                onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Select value={formData.reason} onValueChange={(val) => handleChange('reason', val)}>
                            <SelectTrigger className="bg-[var(--background)] border-[var(--border)]"><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[105]">
                                <SelectItem value="PURCHASE">Purchase</SelectItem>
                                <SelectItem value="PRODUCTION_INPUT">Production Input</SelectItem>
                                <SelectItem value="ORDER_FULFILLMENT">Order Fulfillment</SelectItem>
                                <SelectItem value="DAMAGE">Damage / Spoilage</SelectItem>
                                <SelectItem value="SAMPLE">Sample</SelectItem>
                                <SelectItem value="EVENT">Event</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Reference ID <span className="text-[var(--text-muted)] text-xs">(optional)</span></Label>
                        <Input
                            placeholder="e.g. ORD-2026-0001 or B-2026-005"
                            value={formData.referenceId}
                            onChange={(e) => handleChange('referenceId', e.target.value)}
                            className="bg-[var(--background)] border-[var(--border)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notes <span className="text-[var(--text-muted)] text-xs">(optional)</span></Label>
                        <Textarea
                            placeholder="Additional details..."
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            className="bg-[var(--background)] border-[var(--border)] min-h-[60px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</Button>
                    <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Logging...' : 'Log Movement'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
