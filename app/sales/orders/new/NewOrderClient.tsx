'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Save, ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { createOrder } from '@/app/actions/sales/orders';

// Minimal types for props
type ClientWithCompany = any;
type ProductWithCat = any;
type CompanyPricingTierData = any;

interface NewOrderClientProps {
    clients: ClientWithCompany[];
    products: ProductWithCat[];
    companyPricingTiers: CompanyPricingTierData[];
    globalPricingTiers: any[];
}

interface LineItem {
    id: string; // for React keys
    productId: string;
    quantity: number;
    discount: number; // manual override discount amount
}

export default function NewOrderClient({
    clients,
    products,
    companyPricingTiers,
    globalPricingTiers
}: NewOrderClientProps) {
    const router = useRouter();
    const { t, isRTL } = useTranslation();

    const [isSaving, setIsSaving] = useState(false);
    const [clientId, setClientId] = useState<string>('');
    const [channel, setChannel] = useState<string>('b2b');
    const [notes, setNotes] = useState('');
    const [shippingCost, setShippingCost] = useState(0);
    const [vatRate, setVatRate] = useState(15); // 15% VAT default

    const [items, setItems] = useState<LineItem[]>([
        { id: crypto.randomUUID(), productId: '', quantity: 1, discount: 0 }
    ]);

    // Derived Data
    const selectedClient = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId]);
    const companyId = selectedClient?.companyId;

    // Helper to calculate the unit price for a given product and current client
    const getUnitPrice = (productId: string) => {
        if (!productId) return 0;

        const product = products.find(p => p.id === productId);
        if (!product) return 0;

        const basePrice = product.baseRetailPrice;
        let discountPercent = 0;

        if (companyId && product.categoryId) {
            // Find if this company has a specific overriding tier for this product's category
            const compTier = companyPricingTiers.find(
                ct => ct.companyId === companyId && ct.categoryId === product.categoryId
            );
            if (compTier && compTier.pricingTier) {
                discountPercent = compTier.pricingTier.discountPercent;
            }
        }

        // If no discount found yet, and we are not B2B, maybe apply global?
        // (Simplified: keeping global checks available if needed, but primarily relying on company tiers)

        return basePrice * (1 - (discountPercent / 100));
    };

    // Derived calculations
    const lineItemsWithTotals = useMemo(() => {
        return items.map(item => {
            const unitPrice = getUnitPrice(item.productId);
            const rawTotal = item.quantity * unitPrice;
            const finalTotal = Math.max(0, rawTotal - item.discount);

            return {
                ...item,
                unitPrice,
                total: finalTotal
            };
        });
    }, [items, clientId, products, companyPricingTiers]);

    const subTotal = lineItemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const totalDiscount = lineItemsWithTotals.reduce((sum, item) => sum + (item.discount || 0), 0);
    const vatAmount = subTotal * (vatRate / 100);
    const grandTotal = subTotal + vatAmount + shippingCost;

    // Handlers
    const addLineItem = () => {
        setItems([...items, { id: crypto.randomUUID(), productId: '', quantity: 1, discount: 0 }]);
    };

    const removeLineItem = (id: string) => {
        if (items.length === 1) return; // keep at least one
        setItems(items.filter(i => i.id !== id));
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSave = async () => {
        if (!clientId) {
            alert('Please select a client');
            return;
        }

        const validItems = lineItemsWithTotals.filter(i => i.productId && i.quantity > 0);
        if (validItems.length === 0) {
            alert('Please add at least one valid product');
            return;
        }

        setIsSaving(true);
        try {
            const result = await createOrder({
                clientId,
                companyId: companyId || undefined,
                channel: channel as any,
                notes,
                items: validItems.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    discount: i.discount
                })),
                subTotal,
                discount: totalDiscount,
                vat: vatAmount,
                shippingCost,
                grandTotal
            });

            if (result.success) {
                router.push('/sales/orders');
            } else {
                alert(result.error || 'Failed to create order');
                setIsSaving(false);
            }
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred');
            setIsSaving(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-SA', { style: 'currency', currency: 'SAR' }).format(amount);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <PageHeader title={isRTL ? 'طلب جديد' : 'New Order'} />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-[var(--primary)] text-white"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Create Order'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Order Details & Line Items */}
                <div className="md:col-span-2 space-y-6">

                    {/* Basic Info Card */}
                    <Card className="p-6 bg-[var(--card)] border-[var(--border)]">
                        <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-[var(--primary)]" />
                            Order Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Client <span className="text-red-500">*</span></Label>
                                <Select value={clientId} onValueChange={setClientId}>
                                    <SelectTrigger className="bg-[var(--background)] border-[var(--border)]">
                                        <SelectValue placeholder="Select a client..." />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="z-[100] max-h-60">
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} {c.company ? `(${c.company.name})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Sales Channel</Label>
                                <Select value={channel} onValueChange={setChannel}>
                                    <SelectTrigger className="bg-[var(--background)] border-[var(--border)]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="z-[100]">
                                        <SelectItem value="b2b">B2B (Wholesale)</SelectItem>
                                        <SelectItem value="b2c">B2C (Retail)</SelectItem>
                                        <SelectItem value="pos">POS</SelectItem>
                                        <SelectItem value="event">Event / Expo</SelectItem>
                                        <SelectItem value="export">Export</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    {/* Line Items Card */}
                    <Card className="p-6 bg-[var(--card)] border-[var(--border)] overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Line Items</h2>
                        </div>

                        <div className="space-y-4">
                            {lineItemsWithTotals.map((item, index) => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-4 border border-[var(--border)] rounded-md bg-[var(--background)]/50">
                                    <div className="w-full sm:flex-1 space-y-2">
                                        <Label>Product</Label>
                                        <Select value={item.productId} onValueChange={(val) => updateLineItem(item.id, 'productId', val)}>
                                            <SelectTrigger className="bg-[var(--background)] border-[var(--border)]">
                                                <SelectValue placeholder="Select product..." />
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="z-[100]">
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} ({formatCurrency(p.baseRetailPrice)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {item.productId && (
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Active Unit Price: {formatCurrency(item.unitPrice)}
                                                {/* Show if a discount tier was applied implicitly via the unit price drop */}
                                            </p>
                                        )}
                                    </div>

                                    <div className="w-full sm:w-24 space-y-2">
                                        <Label>Qty</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                            className="bg-[var(--background)] border-[var(--border)]"
                                        />
                                    </div>

                                    <div className="w-full sm:w-32 space-y-2">
                                        <Label>Discount (SAR)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.discount}
                                            onChange={(e) => updateLineItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                            className="bg-[var(--background)] border-[var(--border)]"
                                        />
                                    </div>

                                    <div className="w-full sm:w-32 space-y-2 pb-2 text-right">
                                        <Label className="block mb-2 sm:mb-4">Total</Label>
                                        <span className="font-semibold text-[var(--text-primary)]">
                                            {formatCurrency(item.total)}
                                        </span>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLineItem(item.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        disabled={items.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                onClick={addLineItem}
                                className="w-full mt-2 border-dashed border-[var(--text-muted)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)]"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Another Product
                            </Button>
                        </div>
                    </Card>

                </div>

                {/* Right Column: Financial Summary */}
                <div className="space-y-6">
                    <Card className="p-6 bg-[var(--card)] border-[var(--border)] sticky top-6">
                        <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Summary</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center text-[var(--text-secondary)]">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subTotal)}</span>
                            </div>

                            {totalDiscount > 0 && (
                                <div className="flex justify-between items-center text-emerald-600">
                                    <span>Manual Discounts</span>
                                    <span>-{formatCurrency(totalDiscount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span className="text-[var(--text-secondary)]">VAT Rate (%)</span>
                                <Input
                                    type="number"
                                    value={vatRate}
                                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                                    className="w-20 h-8 text-right bg-[var(--background)] border-[var(--border)]"
                                />
                            </div>

                            <div className="flex justify-between items-center text-[var(--text-secondary)]">
                                <span>VAT Amount</span>
                                <span>{formatCurrency(vatAmount)}</span>
                            </div>

                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--border)]/50">
                                <span className="text-[var(--text-secondary)]">Shipping</span>
                                <Input
                                    type="number"
                                    value={shippingCost}
                                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                                    className="w-24 h-8 text-right bg-[var(--background)] border-[var(--border)]"
                                />
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)] font-bold text-lg text-[var(--text-primary)]">
                                <span>Grand Total</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <Label>Notes for Invoice</Label>
                            <Textarea
                                placeholder="Add any special instructions..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="resize-none bg-[var(--background)] border-[var(--border)]"
                                rows={3}
                            />
                        </div>

                        <Button
                            className="w-full mt-6 bg-[var(--primary)] text-white"
                            size="lg"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Confirm & Save Order'}
                        </Button>
                    </Card>
                </div>

            </div>
        </div>
    );
}
