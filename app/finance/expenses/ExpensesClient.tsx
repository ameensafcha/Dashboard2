'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    Filter,
    TrendingDown,
    Receipt,
    BarChart3,
    ArrowRight,
    Package,
    Truck,
    Megaphone,
    Users,
    Home,
    Zap,
    Wrench,
    CircleEllipsis,
    Factory,
    CreditCard,
    Banknote,
    ArrowUpRight
} from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/app/actions/finance/expenses';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const CATEGORIES = [
    { value: 'raw_materials', icon: <Package className="w-4 h-4" />, color: 'bg-orange-500' },
    { value: 'production', icon: <Factory className="w-4 h-4" />, color: 'bg-blue-500' },
    { value: 'shipping', icon: <Truck className="w-4 h-4" />, color: 'bg-cyan-500' },
    { value: 'marketing', icon: <Megaphone className="w-4 h-4" />, color: 'bg-pink-500' },
    { value: 'salaries', icon: <Users className="w-4 h-4" />, color: 'bg-green-500' },
    { value: 'rent', icon: <Home className="w-4 h-4" />, color: 'bg-yellow-600' },
    { value: 'utilities', icon: <Zap className="w-4 h-4" />, color: 'bg-purple-500' },
    { value: 'equipment', icon: <Wrench className="w-4 h-4" />, color: 'bg-indigo-500' },
    { value: 'other', icon: <CircleEllipsis className="w-4 h-4" />, color: 'bg-gray-500' },
];

const PAYMENT_METHODS = [
    { value: 'bank_transfer', icon: <ArrowUpRight className="w-4 h-4" /> },
    { value: 'cash', icon: <Banknote className="w-4 h-4" /> },
    { value: 'credit_card', icon: <CreditCard className="w-4 h-4" /> },
];

interface ExpenseItem {
    id: string;
    expenseId: string;
    category: string;
    amount: number;
    vat: number;
    description: string;
    vendor: string | null;
    paymentMethod: string | null;
    date: Date;
    notes: string | null;
}

const defaultForm = { category: 'other', amount: 0, vat: 0, description: '', vendor: '', paymentMethod: 'none', date: new Date().toISOString().split('T')[0], notes: '' };

export default function ExpensesClient({ initialExpenses }: { initialExpenses: ExpenseItem[] }) {
    const { t, language, isRTL } = useTranslation();
    const [expenses, setExpenses] = useState(initialExpenses);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<ExpenseItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultForm);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filterCat, setFilterCat] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const refresh = async () => {
        const data = await getExpenses(filterCat === 'all' ? undefined : filterCat as any);
        setExpenses(data as any);
    };

    const openCreate = () => {
        setEditItem(null);
        setForm(defaultForm);
        setModalOpen(true);
    };

    const openEdit = (e: ExpenseItem) => {
        setEditItem(e);
        setForm({
            category: e.category,
            amount: Number(e.amount),
            vat: Number(e.vat || 0),
            description: e.description,
            vendor: e.vendor || '',
            paymentMethod: e.paymentMethod || 'none',
            date: new Date(e.date).toISOString().split('T')[0],
            notes: e.notes || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.description || form.amount <= 0) {
            toast({ title: t.error, description: language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields', type: 'error' });
            return;
        }
        setIsSaving(true);

        const payload = {
            category: form.category as any,
            amount: form.amount,
            vat: form.vat || 0,
            description: form.description,
            vendor: form.vendor || undefined,
            paymentMethod: form.paymentMethod !== 'none' ? form.paymentMethod as any : undefined,
            date: new Date(form.date),
            notes: form.notes || undefined,
        };

        const result = editItem
            ? await updateExpense(editItem.id, payload)
            : await createExpense(payload);

        setIsSaving(false);
        if (result.success) {
            toast({ title: t.success, description: editItem ? t.expenseUpdated : t.expenseCreated });
            setModalOpen(false);
            refresh();
        } else {
            toast({ title: t.error, description: result.error || 'Failed', type: 'error' });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        const result = await deleteExpense(deleteId);
        setIsDeleting(false);
        setDeleteId(null);
        if (result.success) {
            toast({ title: t.success, description: t.expenseDeleted });
            refresh();
        }
    };

    const filtered = useMemo(() => {
        let items = expenses;
        if (filterCat !== 'all') items = items.filter(e => e.category === filterCat);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(e =>
                e.description.toLowerCase().includes(q) ||
                (e.vendor && e.vendor.toLowerCase().includes(q)) ||
                e.expenseId.toLowerCase().includes(q)
            );
        }
        return items;
    }, [expenses, filterCat, searchQuery]);

    const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalVat = filtered.reduce((sum, e) => sum + Number(e.vat || 0), 0);

    const topCategory = useMemo(() => {
        const cats: Record<string, number> = {};
        expenses.forEach(e => {
            cats[e.category] = (cats[e.category] || 0) + Number(e.amount);
        });
        const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
        return sorted[0] ? sorted[0][0] : 'none';
    }, [expenses]);

    return (
        <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Grid */}
            <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", isRTL ? "rtl" : "")}>
                <Card className="rounded-3xl border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm overflow-hidden group hover:border-[var(--primary)]/30 transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.monthlyBurn}</p>
                                <h3 className="text-2xl font-black text-red-500">
                                    SAR {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                                <TrendingDown className="w-6 h-6 text-red-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm overflow-hidden group hover:border-[var(--primary)]/30 transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.vatProvision}</p>
                                <h3 className="text-2xl font-black text-blue-500">
                                    SAR {totalVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                <Receipt className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm overflow-hidden group hover:border-[var(--primary)]/30 transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.topCategory}</p>
                                <h3 className="text-2xl font-black text-[var(--primary)]">
                                    {topCategory !== 'none' ? (t as any)[`cat_${topCategory}`] : '-'}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-6 h-6 text-[var(--primary)]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", isRTL ? "sm:flex-row-reverse" : "")}>
                <div className={cn("flex items-center gap-3 w-full sm:w-auto", isRTL ? "flex-row-reverse" : "")}>
                    <div className="relative flex-1 sm:w-[300px]">
                        <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]", isRTL ? "right-4" : "left-4")} />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.search}
                            className={cn("h-11 bg-[var(--card)] border-[var(--border)] rounded-2xl focus:ring-1 focus:ring-[var(--primary)] text-sm font-bold", isRTL ? "pr-11 pl-4 text-right" : "pl-11 pr-4")}
                        />
                    </div>
                    <Select value={filterCat} onValueChange={setFilterCat}>
                        <SelectTrigger className="w-[180px] h-11 bg-[var(--card)] border-[var(--border)] rounded-2xl text-xs font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5" />
                                <SelectValue placeholder={t.allCategories} />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                            <SelectItem value="all" className="text-xs font-black uppercase tracking-widest">{t.allCategories}</SelectItem>
                            {CATEGORIES.map(c => (
                                <SelectItem key={c.value} value={c.value} className="text-xs font-black uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        {c.icon}
                                        {(t as any)[`cat_${c.value}`]}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={openCreate}
                    className="h-11 px-8 rounded-2xl bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-lg shadow-[var(--primary)]/20 font-black text-[10px] tracking-widest uppercase transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-2" /> {t.addExpense}
                </Button>
            </div>

            {/* Table */}
            <Card className="rounded-3xl border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--muted)]/20 border-b border-[var(--border)]">
                                <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "")}>{t.expenseId}</th>
                                <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "")}>{t.category}</th>
                                <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "")}>{t.description}</th>
                                <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "")}>{t.vendor}</th>
                                <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] text-right", isRTL ? "text-left" : "")}>{t.amountSar}</th>
                                <th className={cn("px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "")}>{t.date}</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]/50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                                            <Receipt className="w-12 h-12" />
                                            <p className="text-sm font-bold">{language === 'ar' ? 'لا توجد مصروفات حالياً' : 'No expenses found'}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(e => (
                                    <tr key={e.id} className="group hover:bg-[var(--primary)]/5 transition-colors duration-200">
                                        <td className={cn("px-6 py-5 text-xs font-mono font-bold text-[var(--text-secondary)]", isRTL ? "text-right" : "")}>{e.expenseId}</td>
                                        <td className="px-6 py-5">
                                            <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0", CATEGORIES.find(c => c.value === e.category)?.color || 'bg-gray-500')}>
                                                    {CATEGORIES.find(c => c.value === e.category)?.icon}
                                                </div>
                                                <span className="text-xs font-bold text-[var(--text-primary)]">
                                                    {(t as any)[`cat_${e.category}`]}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={cn("px-6 py-5 text-xs font-bold text-[var(--text-primary)]", isRTL ? "text-right" : "")}>{e.description}</td>
                                        <td className={cn("px-6 py-5 text-xs font-bold text-[var(--text-secondary)]", isRTL ? "text-right" : "")}>{e.vendor || '-'}</td>
                                        <td className={cn("px-6 py-5 text-sm font-black text-red-500 text-right", isRTL ? "text-left" : "")}>
                                            - SAR {Number(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={cn("px-6 py-5 text-xs font-bold text-[var(--text-secondary)]", isRTL ? "text-right" : "")}>
                                            {new Date(e.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(e)} className="p-2 rounded-xl hover:bg-blue-500/10 text-[var(--text-secondary)] hover:text-blue-500 transition-all active:scale-90">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteId(e.id)} className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-all active:scale-90">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create/Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-5xl p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
                    <div className={cn("flex flex-col md:flex-row h-full min-h-[600px]", isRTL ? "md:flex-row-reverse" : "")}>
                        {/* Sidebar: Refined with Gradient & Minimalist Style */}
                        <div className="w-full md:w-[260px] bg-gradient-to-b from-[var(--muted)]/40 to-[var(--muted)]/10 border-b md:border-b-0 md:border-r border-[var(--border)] p-10 flex flex-col justify-between">
                            <div className="space-y-8">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-inner">
                                    <Receipt className="w-6 h-6 text-[var(--primary)]" />
                                </div>
                                <div className="space-y-3">
                                    <DialogTitle className="text-2xl font-black text-[var(--text-primary)] leading-tight tracking-tight">
                                        {editItem ? t.editExpense : t.addExpense}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs font-bold text-[var(--text-disabled)] leading-relaxed uppercase tracking-widest">
                                        {t.expenseDetails}
                                    </DialogDescription>
                                </div>
                            </div>

                            <div className="hidden md:block space-y-6 pt-10 border-t border-[var(--border)]/50">
                                <div className="p-4 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                                    <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-tighter mb-1">PRO TIP</p>
                                    <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-tight">
                                        Accurate VAT entry ensures seamless tax reporting.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form area: Improved Spacing & Layout */}
                        <div className="flex-1 p-10 md:p-12 overflow-y-auto max-h-[85vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] px-1">{t.category} *</Label>
                                    <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                                        <SelectTrigger className="h-14 bg-[var(--muted)]/20 border-[var(--border)] rounded-2xl font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" side="bottom" className="bg-zinc-900/90 backdrop-blur-xl border-zinc-500/20 rounded-2xl shadow-2xl p-1 [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-scroll-down-button]]:hidden">
                                            {CATEGORIES.map(c => (
                                                <SelectItem key={c.value} value={c.value} className="font-bold cursor-pointer rounded-xl transition-all focus:bg-[var(--primary)]/10 focus:text-[var(--primary)] group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-1.5 rounded-lg opacity-40 group-focus:opacity-100 transition-opacity", c.color)}>{c.icon}</div>
                                                        {(t as any)[`cat_${c.value}`]}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] px-1">{t.amountSar} *</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={form.amount || ''}
                                            onChange={(e) => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                                            className="h-14 bg-[var(--muted)]/20 border-[var(--border)] rounded-2xl font-black text-red-500 text-lg"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px) font-black uppercase tracking-widest text-[var(--text-disabled)] px-1">{t.vatSar}</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={form.vat || ''}
                                            onChange={(e) => setForm(f => ({ ...f, vat: parseFloat(e.target.value) || 0 }))}
                                            className="h-14 bg-[var(--muted)]/20 border-[var(--border)] rounded-2xl font-black text-blue-500 text-lg"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] px-1">{t.description} *</Label>
                                    <Input
                                        value={form.description}
                                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                        className="h-14 bg-[var(--muted)]/20 border-[var(--border)] rounded-2xl font-bold"
                                        placeholder="What was this for?"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] px-1">{t.vendor}</Label>
                                    <Input
                                        value={form.vendor}
                                        onChange={(e) => setForm(f => ({ ...f, vendor: e.target.value }))}
                                        className="h-14 bg-[var(--muted)]/20 border-[var(--border)] rounded-2xl font-bold"
                                        placeholder="Supplier name"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] px-1">{t.paymentMethod}</Label>
                                    <Select value={form.paymentMethod} onValueChange={(v) => setForm(f => ({ ...f, paymentMethod: v }))}>
                                        <SelectTrigger className="h-14 bg-[var(--muted)]/20 border-[var(--border)] rounded-2xl font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" side="bottom" className="bg-zinc-900/90 backdrop-blur-xl border-zinc-500/20 rounded-2xl shadow-xl p-1 [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-scroll-down-button]]:hidden">
                                            <SelectItem value="none" className="font-bold opacity-40 cursor-pointer rounded-xl focus:bg-[var(--primary)]/10">
                                                {t.pay_not_specified}
                                            </SelectItem>
                                            {PAYMENT_METHODS.map(m => (
                                                <SelectItem key={m.value} value={m.value} className="font-bold cursor-pointer rounded-xl transition-all focus:bg-[var(--primary)]/10 focus:text-[var(--primary)] group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 group-focus:text-[var(--primary)] transition-colors">{m.icon}</div>
                                                        {(t as any)[`pay_${m.value}`]}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] px-1">{t.date}</Label>
                                    <Input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="h-14 bg-[var(--muted)]/20 border-[var(--border)] rounded-2xl font-bold"
                                    />
                                </div>

                                <div className="space-y-3 md:col-span-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] px-1">{t.notes}</Label>
                                    <Textarea
                                        value={form.notes}
                                        onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="Additional context..."
                                        className="min-h-[120px] bg-[var(--muted)]/20 border-[var(--border)] rounded-2xl font-bold p-6 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="mt-12 flex items-center gap-4">
                                <Button
                                    onClick={() => setModalOpen(false)}
                                    variant="outline"
                                    className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] border-[var(--border)] hover:bg-[var(--muted)]/30"
                                >
                                    {t.cancel}
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSaving}
                                    className="flex-1 h-14 rounded-2xl bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-2xl shadow-[var(--primary)]/20 font-black text-[11px] tracking-widest uppercase transition-all active:scale-95"
                                >
                                    {isSaving ? 'Processing...' : (editItem ? t.saveChanges : t.addExpense)}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>

            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-[var(--card)] border-[var(--border)] rounded-3xl p-8 max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black text-[var(--text-primary)]">{t.confirmDeleteExpense}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-bold text-[var(--text-secondary)] leading-relaxed pt-2">
                            {t.expenseDeletedMsg}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="pt-8 flex gap-4">
                        <AlertDialogCancel className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border-[var(--border)] bg-transparent hover:bg-[var(--muted)]/20">
                            {t.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 font-black text-[10px] tracking-widest uppercase transition-all active:scale-95 border-0"
                        >
                            {isDeleting ? 'Deleting...' : t.delete}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
