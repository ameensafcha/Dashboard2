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
    ShoppingBag
} from 'lucide-react';
import { useTranslation, translations, Language } from '@/lib/i18n';
import { createOrder, CreateOrderInput } from '@/app/actions/sales/orders';
import { useSalesStore } from '@/stores/salesStore';
import { useCrmStore } from '@/stores/crmStore';
import { getFinishedProducts } from '@/app/actions/inventory/finished-products';
import { getContacts } from '@/app/actions/crm/contacts';
import { getCompanies } from '@/app/actions/crm/companies';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NewOrderClient({
    clients = [],
    products = [],
    companyPricingTiers = [],
    globalPricingTiers = []
}: any) {
    const router = useRouter();
    const { isRTL, language } = useTranslation();
    const { setOrders } = useSalesStore();
    const { contacts, companies, setContacts, setCompanies } = useCrmStore();

    const [loading, setLoading] = useState(false);
    const [localProducts, setLocalProducts] = useState<any[]>(products);

    const [formData, setFormData] = useState<Omit<CreateOrderInput, 'subTotal' | 'discount' | 'vat' | 'shippingCost' | 'grandTotal'> & { shippingCost: number }>({
        clientId: '',
        companyId: '',
        channel: 'b2c' as any,
        notes: '',
        shippingCost: 0,
        items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }]
    });

    const [orderNumber, setOrderNumber] = useState('');
    const [mounted, setMounted] = useState(false);

    // Initial Data Fetching
    useEffect(() => {
        setMounted(true);
        setOrderNumber(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);

        const fetchData = async () => {
            const [prodRes, contactRes, companyRes] = await Promise.all([
                getFinishedProducts(),
                getContacts(),
                getCompanies()
            ]);

            if (prodRes.success) setLocalProducts(prodRes.products);
            if (Array.isArray(contactRes)) setContacts(contactRes as any);
            if (Array.isArray(companyRes)) setCompanies(companyRes as any);
        };
        fetchData();
    }, [setContacts, setCompanies]);

    // Calculations
    const calculations = useMemo(() => {
        const subTotal = formData.items.reduce((acc, item) => {
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
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
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
            const product = localProducts.find(p => p.productId === value);
            if (product) {
                newItems[index].unitPrice = product.retailPrice;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async () => {
        if (!formData.clientId) {
            toast({
                title: t.error,
                description: translations[language as Language].selectCustomer,
                type: 'error'
            });
            return;
        }

        const invalidItems = formData.items.filter(item => !item.productId);
        if (invalidItems.length > 0) {
            toast({
                title: t.error,
                description: translations[language as Language].selectProduct,
                type: 'error'
            });
            return;
        }

        setLoading(true);
        try {
            const result = await createOrder({
                clientId: formData.clientId,
                companyId: formData.companyId !== 'none' ? formData.companyId : undefined,
                channel: formData.channel as any,
                notes: formData.notes,
                items: formData.items,
                subTotal: calculations.subTotal,
                discount: formData.items.reduce((acc, item) => acc + (item.discount || 0), 0),
                vat: calculations.vat,
                shippingCost: formData.shippingCost,
                grandTotal: calculations.grandTotal,
            } as CreateOrderInput);

            if (result.success) {
                toast({
                    title: language === 'ar' ? 'تم إنشاء الطلب بنجاح' : 'Success',
                    description: language === 'ar' ? 'تمت إضافة الطلب بنجاح' : 'Order has been created successfully.',
                    type: 'success'
                });
                router.push('/sales/orders');
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to create order',
                    type: 'error'
                });
            }
        } catch (error) {
            toast({
                title: 'System Error',
                description: 'An unexpected error occurred.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Smart Contact-Company Linking
    const selectedContact = useMemo(() => {
        if (!formData.clientId) return null;
        return contacts.find((c: any) => c.id === formData.clientId) || null;
    }, [formData.clientId, contacts]);

    const contactHasNoCompany = selectedContact && !selectedContact.companyId;

    const filteredContacts = useMemo(() => {
        if (!formData.companyId || formData.companyId === 'none') return contacts;
        return contacts.filter((c: any) => c.companyId === formData.companyId);
    }, [contacts, formData.companyId]);

    const handleContactChange = (contactId: string) => {
        const contact = contacts.find((c: any) => c.id === contactId);
        if (contact?.companyId) {
            // Auto-fill company from contact
            setFormData({ ...formData, clientId: contactId, companyId: contact.companyId });
        } else {
            // Contact has no company → disable company selector
            setFormData({ ...formData, clientId: contactId, companyId: 'none' });
        }
    };

    const handleCompanyChange = (companyId: string) => {
        // Reset contact when company changes (because old contact may not belong to new company)
        setFormData({ ...formData, companyId, clientId: '' });
    };

    const t = {
        title: language === 'ar' ? 'طلب مبيعات جديد' : 'New Sales Order',
        client: language === 'ar' ? 'العميل' : 'Customer',
        company: language === 'ar' ? 'الشركة' : 'Company',
        channel: language === 'ar' ? 'القناة' : 'Sales Channel',
        date: language === 'ar' ? 'التاريخ' : 'Order Date',
        items: language === 'ar' ? 'الأصناف' : 'Order Items',
        shipping: language === 'ar' ? 'رسوم الشحن' : 'Shipping Fee',
        notes: language === 'ar' ? 'ملاحظات' : 'Internal Notes',
        addItem: language === 'ar' ? 'إضافة صنف' : 'Add Item',
        summary: language === 'ar' ? 'ملخص الطلب' : 'Order Summary',
        confirm: language === 'ar' ? 'تأكيد الطلب' : 'Create Order',
        subTotal: language === 'ar' ? 'المجموع الفرعي' : 'Subtotal',
        vat: language === 'ar' ? 'الضريبة' : 'VAT (15%)',
        total: language === 'ar' ? 'الإجمالي' : 'Grand Total',
        error: language === 'ar' ? 'خطأ' : 'Error',
        success: language === 'ar' ? 'نجاح' : 'Success',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
            <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "")}>
                <div className="space-y-1">
                    <Link
                        href="/sales/orders"
                        className={cn("text-xs font-bold text-[var(--text-disabled)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors group", isRTL ? "flex-row-reverse" : "")}
                    >
                        <ArrowLeft className={cn("w-3 h-3 transition-transform", isRTL ? "rotate-180 group-hover:translate-x-1" : "group-hover:-translate-x-1")} />
                        {language === 'ar' ? 'العودة للمبيعات' : 'Back to Orders'}
                    </Link>
                    <PageHeader title={t.title} />
                </div>
                <div className="text-right hidden sm:block">
                    <Badge variant="outline" className="rounded-full px-4 py-1.5 border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] font-black text-[10px] tracking-widest uppercase shadow-sm">
                        {mounted ? orderNumber : '...'}
                    </Badge>
                </div>
            </div>

            <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-8", isRTL ? "lg:flex-row-reverse" : "")}>
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Customer Selection Card */}
                    <Card className="rounded-3xl border-[var(--border)] overflow-hidden shadow-xl bg-[var(--card)]/50 backdrop-blur-sm">
                        <CardHeader className="bg-[var(--muted)]/20 border-b border-[var(--border)] p-6">
                            <CardTitle className="text-lg flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                                    <User className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                {t.client}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Company First */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">{t.company}</Label>
                                    <Select
                                        value={formData.companyId || 'none'}
                                        onValueChange={handleCompanyChange}
                                        disabled={!!contactHasNoCompany}
                                    >
                                        <SelectTrigger className={cn(
                                            "h-12 bg-[var(--background)] border-[var(--border)] rounded-2xl focus:ring-1 focus:ring-[var(--primary)] text-sm font-bold",
                                            contactHasNoCompany && "opacity-40 cursor-not-allowed"
                                        )}>
                                            <SelectValue placeholder={contactHasNoCompany ? 'No company linked' : 'Select company...'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" className="font-bold opacity-50">
                                                {language === 'ar' ? 'بدون شركة' : 'All / Independent'}
                                            </SelectItem>
                                            {companies.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id} className="cursor-pointer font-bold">{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {contactHasNoCompany && (
                                        <p className="text-[10px] text-amber-500 font-bold px-1">
                                            {language === 'ar' ? 'هذا العميل غير مرتبط بشركة' : 'This contact has no linked company'}
                                        </p>
                                    )}
                                </div>

                                {/* Contact (filtered by company) */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">
                                        {t.client}
                                        {formData.companyId && formData.companyId !== 'none' && (
                                            <span className="text-[var(--primary)] ml-2">
                                                ({filteredContacts.length})
                                            </span>
                                        )}
                                    </Label>
                                    <Select
                                        value={formData.clientId}
                                        onValueChange={handleContactChange}
                                    >
                                        <SelectTrigger className="h-12 bg-[var(--background)] border-[var(--border)] rounded-2xl focus:ring-1 focus:ring-[var(--primary)] text-sm font-bold">
                                            <SelectValue placeholder={
                                                formData.companyId && formData.companyId !== 'none'
                                                    ? (language === 'ar' ? 'اختر من موظفي الشركة...' : 'Select company contact...')
                                                    : (language === 'ar' ? 'ابحث عن عميل...' : 'Search for customer...')
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredContacts.length === 0 ? (
                                                <div className="p-3 text-xs text-center text-[var(--text-disabled)] font-bold">
                                                    {language === 'ar' ? 'لا توجد جهات اتصال' : 'No contacts found'}
                                                </div>
                                            ) : (
                                                filteredContacts.map((c: any) => (
                                                    <SelectItem key={c.id} value={c.id} className="cursor-pointer font-bold">
                                                        <div className="flex items-center gap-2">
                                                            {c.name}
                                                            {c.company && (!formData.companyId || formData.companyId === 'none') && (
                                                                <span className="text-[10px] opacity-40 ml-1">— {c.company.name}</span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[var(--border)]/10">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">{t.channel}</Label>
                                    <Select
                                        value={formData.channel}
                                        onValueChange={(v: any) => setFormData({ ...formData, channel: v })}
                                    >
                                        <SelectTrigger className="h-12 bg-[var(--background)] border-[var(--border)] rounded-2xl focus:ring-1 focus:ring-[var(--primary)] text-sm font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[
                                                { value: 'b2b', label: translations[language as Language].chan_b2b },
                                                { value: 'b2c', label: translations[language as Language].chan_b2c },
                                                { value: 'pos', label: translations[language as Language].chan_pos },
                                                { value: 'event', label: translations[language as Language].chan_event },
                                                { value: 'export', label: translations[language as Language].chan_export },
                                                { value: 'other', label: translations[language as Language].chan_other },
                                            ].map(c => (
                                                <SelectItem key={c.value} value={c.value} className="font-bold">{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">{t.date}</Label>
                                    <div className="h-12 bg-[var(--muted)]/20 border border-[var(--border)] rounded-2xl flex items-center px-4 gap-3 text-sm text-[var(--text-primary)] font-bold">
                                        <Calendar className="w-4 h-4 text-[var(--primary)]" />
                                        {mounted ? new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Items Card */}
                    <Card className="rounded-3xl border-[var(--border)] overflow-hidden shadow-xl bg-[var(--card)]/50 backdrop-blur-sm">
                        <CardHeader className="bg-[var(--muted)]/20 border-b border-[var(--border)] p-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                                    <Package className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                {t.items}
                            </CardTitle>
                            <Button
                                onClick={handleAddItem}
                                variant="outline"
                                className="h-10 rounded-xl border-[var(--primary)]/30 text-[var(--primary)] font-black text-[10px] uppercase tracking-widest px-6 hover:bg-[var(--primary)] hover:text-black transition-all"
                            >
                                <Plus className="w-3.5 h-3.5 mr-2" />
                                {t.addItem}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-[var(--border)]">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="p-6 md:p-8 space-y-6 group relative translate-x-0 bg-transparent hover:bg-[var(--muted)]/5 transition-colors">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                            <div className="md:col-span-6 space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest px-1 opacity-50">Component Selection</Label>
                                                <Select
                                                    value={item.productId}
                                                    onValueChange={(v) => handleItemChange(index, 'productId', v)}
                                                >
                                                    <SelectTrigger className="h-12 bg-[var(--background)] border-[var(--border)] rounded-xl focus:ring-1 focus:ring-[var(--primary)] font-bold text-sm transition-all">
                                                        <SelectValue placeholder="Select Finished Product..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {localProducts.map((p: any) => {
                                                            const isSelected = formData.items.some((oi: any, i: number) => oi.productId === p.productId && i !== index);
                                                            if (isSelected) return null;
                                                            return <SelectItem key={p.id} value={p.productId} className="font-bold">{p.product?.name || p.sku} <span className="text-[10px] opacity-40 ml-2">({p.variant})</span></SelectItem>;
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="md:col-span-2 space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest px-1 opacity-50 text-center block">Qty</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity === 0 ? '' : item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    className="h-12 text-center bg-[var(--background)] border-[var(--border)] rounded-xl font-black focus:ring-[var(--primary)] transition-all"
                                                />
                                            </div>
                                            <div className="md:col-span-3 space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest px-1 opacity-50">Unit Price</Label>
                                                <div className="relative group/price">
                                                    <span className={cn(
                                                        "absolute top-3.5 text-[10px] font-black text-[var(--text-disabled)] tracking-widest",
                                                        isRTL ? "right-4" : "left-4"
                                                    )}>
                                                        SAR
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        value={item.unitPrice === 0 ? '' : item.unitPrice}
                                                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                                                        onFocus={(e) => e.target.select()}
                                                        className={cn(
                                                            "h-12 font-mono font-black bg-[var(--background)] border-[var(--border)] rounded-xl focus:ring-[var(--primary)] transition-all",
                                                            isRTL ? "pr-14 text-left" : "pl-14 text-right"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-1 flex justify-end">
                                                {formData.items.length > 1 && (
                                                    <Button
                                                        onClick={() => handleRemoveItem(index)}
                                                        variant="ghost"
                                                        className="h-12 w-12 rounded-xl text-red-500 hover:bg-red-500/10 active:scale-90 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className={cn("flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-[var(--border)]/10", isRTL ? "flex-row-reverse" : "")}>
                                            <div className={cn("flex items-center gap-6", isRTL ? "flex-row-reverse" : "")}>
                                                <div className="flex bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl overflow-hidden h-10 group-focus-within:border-[var(--primary)]/40 transition-all">
                                                    <div className="px-4 flex items-center bg-[var(--muted)]/40 text-[9px] font-black uppercase tracking-widest border-r border-[var(--border)] text-[var(--text-disabled)]">Discount</div>
                                                    <Input
                                                        type="number"
                                                        value={item.discount === 0 ? '' : item.discount}
                                                        onChange={(e) => handleItemChange(index, 'discount', e.target.value === '' ? 0 : Number(e.target.value))}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-28 h-full border-0 rounded-none bg-transparent text-xs font-black text-emerald-500 focus:ring-0 text-right pr-4"
                                                    />
                                                </div>
                                            </div>
                                            <div className={cn("text-right", isRTL ? "text-left" : "")}>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] opacity-40 mb-1">Line Reconciliation</div>
                                                <div className="text-lg font-black text-[var(--text-primary)] font-mono tracking-tighter">
                                                    SAR {(item.quantity * item.unitPrice - item.discount).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sticky Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-28 space-y-6">
                        <Card className="rounded-3xl border-2 border-[var(--primary)]/20 bg-[var(--card)] shadow-2xl overflow-hidden relative group/summary transition-all hover:border-[var(--primary)]/30">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--primary)] opacity-20" />

                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">{t.summary}</CardTitle>
                                <CardDescription className="font-bold text-[9px] tracking-widest uppercase text-[var(--text-disabled)]">Strategic Financial Matrix</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-8">
                                <div className="space-y-4">
                                    <div className={cn("flex justify-between items-center text-sm font-bold", isRTL ? "flex-row-reverse" : "")}>
                                        <span className="text-[var(--text-secondary)] uppercase text-[10px] tracking-widest">{t.subTotal}</span>
                                        <span className="font-mono text-[var(--text-primary)]">SAR {calculations.subTotal.toLocaleString()}</span>
                                    </div>
                                    <div className={cn("flex justify-between items-center text-sm font-bold", isRTL ? "flex-row-reverse" : "")}>
                                        <span className="text-[var(--text-secondary)] uppercase text-[10px] tracking-widest">{t.vat}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[8px] h-4 rounded-none border-[var(--border)] px-1">15%</Badge>
                                            <span className="font-mono text-emerald-500">+ SAR {calculations.vat.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-[var(--border)]/10">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2 px-1">
                                            <ShoppingBag className="w-3 h-3 text-[var(--primary)]" />
                                            {t.shipping}
                                        </Label>
                                        <div className="relative group/shipping">
                                            <span className={cn(
                                                "absolute top-3 text-[10px] font-black text-[var(--text-disabled)] italic",
                                                isRTL ? "right-4" : "left-4"
                                            )}>
                                                SAR
                                            </span>
                                            <Input
                                                type="number"
                                                value={formData.shippingCost === 0 ? '' : formData.shippingCost}
                                                onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value === '' ? 0 : Number(e.target.value) })}
                                                onFocus={(e) => e.target.select()}
                                                className={cn(
                                                    "h-11 bg-[var(--background)]/50 border-[var(--border)]/50 rounded-2xl font-mono text-sm font-black focus:border-[var(--primary)] transition-all",
                                                    isRTL ? "pr-12 text-left" : "pl-12 text-right"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t-2 border-dashed border-[var(--border)]/20 mt-6 bg-[var(--muted)]/10 -mx-8 px-8 pb-8 rounded-b-3xl">
                                    <div className={cn("flex flex-col gap-2", isRTL ? "items-end" : "items-start")}>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">{t.total}</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[10px] font-black text-[var(--text-disabled)] opacity-40 italic">SAR</span>
                                            <span className="text-4xl font-black font-mono tracking-tighter text-[var(--text-primary)] drop-shadow-sm">
                                                {calculations.grandTotal.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        disabled={loading}
                                        onClick={handleSubmit}
                                        className="w-full h-16 bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[var(--primary)]/20 active:scale-95 transition-all mt-8 group/btn"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin" />
                                                <span>Finalizing...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                {t.confirm}
                                                <ChevronRight className={cn("w-5 h-5 transition-transform group-hover/btn:translate-x-1", isRTL ? "rotate-180" : "")} />
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/30 backdrop-blur-sm p-6 space-y-4 shadow-lg overflow-hidden relative">
                            <div className="flex items-center gap-3 mb-2 px-1">
                                <div className="w-6 h-6 rounded-lg bg-[var(--muted)]/50 flex items-center justify-center">
                                    <Info className="w-3.5 h-3.5 text-[var(--primary)]" />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.notes}</h4>
                            </div>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Strategic intelligence, delivery logistics, or special clauses..."
                                className="bg-[var(--background)]/50 border-[var(--border)] rounded-2xl min-h-[140px] p-5 text-sm font-medium resize-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] transition-all border-dashed"
                            />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
