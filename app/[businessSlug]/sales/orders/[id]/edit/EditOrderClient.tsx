'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
    Plus,
    Trash2,
    ChevronRight,
    User,
    Building2,
    Package,
    Info,
    Calendar,
    ArrowLeft,
    ShoppingBag,
    Loader2,
    Save
} from 'lucide-react';
import { useTranslation, translations, Language } from '@/lib/i18n';
import { updateOrder } from '@/app/actions/sales/orders';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function EditOrderClient({
    order,
    clients = [],
    products = [],
    companies = [],
    companyPricingTiers = [],
    globalPricingTiers = []
}: any) {
    const router = useRouter();
    const { isRTL, language } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        clientId: order.clientId || '',
        companyId: order.companyId || 'none',
        channel: order.channel || 'b2b',
        notes: order.notes || '',
        shippingCost: order.shippingCost || 0,
        items: order.items.length > 0 ? order.items : [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }]
    });

    const calculations = useMemo(() => {
        const subTotal = formData.items.reduce((acc: number, item: any) => {
            return acc + (item.quantity * item.unitPrice) - item.discount;
        }, 0);
        const vat = subTotal * 0.15;
        const grandTotal = subTotal + vat + Number(formData.shippingCost);
        return { subTotal, vat, grandTotal };
    }, [formData.items, formData.shippingCost]);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0, discount: 0 }]
        });
    };

    const handleRemoveItem = (index: number) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_: any, i: number) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const getProductPrice = (productId: string) => {
        const product = products.find((p: any) => p.id === productId);
        if (!product) return 0;

        // B2B Pricing Logic
        if (formData.channel === 'b2b' && formData.companyId !== 'none') {
            const companyTier = companyPricingTiers.find(
                (cpt: any) => cpt.companyId === formData.companyId && cpt.categoryId === product.categoryId
            );
            if (companyTier?.pricingTier) {
                return companyTier.pricingTier.pricePerKg;
            }
        }

        // Fallback to retail price
        return product.retailPrice;
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];

        if (field === 'quantity') {
            const qty = Number(value);
            newItems[index] = { ...newItems[index], [field]: qty < 1 ? 1 : qty };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }

        if (field === 'productId') {
            newItems[index].unitPrice = getProductPrice(value);
        }

        setFormData({ ...formData, items: newItems });
    };

    // Auto-update prices if channel changes
    useEffect(() => {
        const newItems = formData.items.map((item: any) => ({
            ...item,
            unitPrice: item.productId ? getProductPrice(item.productId) : item.unitPrice
        }));
        setFormData(prev => ({ ...prev, items: newItems }));
    }, [formData.channel, products, formData.companyId, companyPricingTiers]); // Added dependencies for getProductPrice

    const handleSubmit = async () => {
        if (!formData.clientId) {
            toast({ title: "Error", description: "Customer is required", type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const result = await updateOrder(order.id, {
                ...formData,
                companyId: formData.companyId !== 'none' ? formData.companyId : undefined,
                subTotal: calculations.subTotal,
                discount: formData.items.reduce((acc: number, item: any) => acc + (item.discount || 0), 0),
                vat: calculations.vat,
                grandTotal: calculations.grandTotal,
            } as any);

            if (result.success) {
                toast({
                    title: language === 'ar' ? 'تم تحديث الطلب بنجاح' : 'Order Updated',
                    description: language === 'ar' ? 'تم حفظ التعديلات' : 'All changes have been successfully saved.',
                    type: 'success'
                });
                router.push('/sales/orders');
                router.refresh();
            } else {
                toast({ title: 'Error', description: result.error || 'Update failed', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'System Error', description: 'An unexpected error occurred.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const filteredContacts = useMemo(() => {
        if (!formData.companyId || formData.companyId === 'none') return clients;
        return clients.filter((c: any) => c.companyId === formData.companyId);
    }, [clients, formData.companyId]);

    const t = {
        title: language === 'ar' ? 'تعديل الطلب' : 'Complete / Edit Order',
        client: language === 'ar' ? 'العميل' : 'Customer',
        company: language === 'ar' ? 'الشركة' : 'Company',
        channel: language === 'ar' ? 'القناة' : 'Sales Channel',
        items: language === 'ar' ? 'الأصناف' : 'Order Items',
        shipping: language === 'ar' ? 'رسوم الشحن' : 'Shipping Fee',
        notes: language === 'ar' ? 'ملاحظات' : 'Internal Notes',
        addItem: language === 'ar' ? 'إضافة صنف' : 'Add Item',
        confirm: language === 'ar' ? 'حفظ التغييرات' : 'Save Changes',
        total: language === 'ar' ? 'الإجمالي' : 'Grand Total',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
            <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "")}>
                <div className="space-y-1">
                    <Link href="/sales/orders" className="text-xs font-bold text-[var(--text-disabled)] hover:text-[var(--primary)] flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" /> Back to Orders
                    </Link>
                    <PageHeader title={t.title} />
                </div>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] font-black text-[10px] tracking-widest uppercase">
                    {order.orderNumber}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Customer Selection */}
                    <Card className="rounded-3xl border-[var(--border)] overflow-hidden shadow-xl bg-[var(--card)]/50">
                        <CardHeader className="bg-[var(--muted)]/20 border-b border-[var(--border)] p-6">
                            <CardTitle className="text-lg flex items-center gap-3">
                                <User className="w-5 h-5 text-[var(--primary)]" /> {t.client}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest opacity-60">{t.company}</Label>
                                    <Select
                                        value={formData.companyId || 'none'}
                                        onValueChange={(v) => setFormData({ ...formData, companyId: v, clientId: '' })}
                                        disabled={true}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl font-bold bg-[var(--muted)]/20 cursor-not-allowed"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" className="font-bold opacity-50">Independent / None</SelectItem>
                                            {companies.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest opacity-60">{t.client}</Label>
                                    <Select
                                        value={formData.clientId}
                                        onValueChange={(v) => setFormData({ ...formData, clientId: v })}
                                        disabled={true}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl font-bold bg-[var(--muted)]/20 cursor-not-allowed"><SelectValue placeholder="Select contact..." /></SelectTrigger>
                                        <SelectContent>
                                            {filteredContacts.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card className="rounded-3xl border-[var(--border)] overflow-hidden shadow-xl bg-[var(--card)]/50">
                        <CardHeader className="bg-[var(--muted)]/20 border-b border-[var(--border)] p-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-3">
                                <Package className="w-5 h-5 text-[var(--primary)]" /> {t.items}
                            </CardTitle>
                            <Button onClick={handleAddItem} variant="outline" className="h-10 rounded-xl border-[var(--primary)]/30 text-[var(--primary)] font-black text-[10px] uppercase">
                                <Plus className="w-3.5 h-3.5 mr-2" /> {t.addItem}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 divide-y divide-[var(--border)]">
                            {formData.items.map((item: any, index: number) => (
                                <div key={index} className="p-8 space-y-6 bg-transparent hover:bg-[var(--muted)]/5">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                        <div className="md:col-span-6 space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Product</Label>
                                            <Select value={item.productId} onValueChange={(v) => handleItemChange(index, 'productId', v)}>
                                                <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Select..." /></SelectTrigger>
                                                <SelectContent>
                                                    {products.map((p: any) => {
                                                        const isSelected = formData.items.some((oi: any, i: number) => oi.productId === p.id && i !== index);
                                                        if (isSelected) return null;
                                                        return <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>;
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="md:col-span-2 space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 text-center block">Qty</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                className="h-12 text-center font-black"
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Price (SAR)</Label>
                                            <Input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))} className="h-12 text-right font-black" />
                                        </div>
                                        <div className="md:col-span-1 flex justify-end">
                                            <Button onClick={() => handleRemoveItem(index)} variant="ghost" className="h-12 w-12 text-red-500"><Trash2 className="w-5 h-5" /></Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                    <Card className="rounded-3xl border-2 border-[var(--primary)]/20 bg-[var(--card)] shadow-2xl p-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-[10px] uppercase tracking-widest opacity-60">Subtotal</span>
                                <span>SAR {calculations.subTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-[10px] uppercase tracking-widest opacity-60">VAT (15%)</span>
                                <span className="text-emerald-500">+ SAR {calculations.vat.toLocaleString()}</span>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-[var(--border)]/10">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Shipping Fee</Label>
                                <Input type="number" value={formData.shippingCost} onChange={(e) => setFormData({ ...formData, shippingCost: Number(e.target.value) })} className="h-11 rounded-2xl font-black text-right" />
                            </div>
                            <div className="pt-8 border-t-2 border-dashed border-[var(--border)]/20 mt-6 text-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">{t.total}</span>
                                <div className="text-4xl font-black tracking-tighter mt-2">SAR {calculations.grandTotal.toLocaleString()}</div>
                                <Button disabled={loading} onClick={handleSubmit} className="w-full h-16 bg-[var(--primary)] text-black mt-8 rounded-2xl font-black uppercase tracking-widest">
                                    {loading ? <Loader2 className="animate-spin" /> : <><Save className="mr-2" /> {t.confirm}</>}
                                </Button>
                            </div>
                        </div>
                    </Card>
                    <Card className="rounded-3xl border border-[var(--border)] p-6 space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Notes</Label>
                        <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="min-h-[140px] rounded-2xl border-dashed" />
                    </Card>
                </div>
            </div>
        </div>
    );
}
