'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/app/actions/finance/expenses';

const CATEGORIES = [
    { value: 'raw_materials', label: 'Raw Materials' },
    { value: 'production', label: 'Production' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'salaries', label: 'Salaries' },
    { value: 'rent', label: 'Rent' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' },
];

const PAYMENT_METHODS = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
];

const catColors: Record<string, string> = {
    raw_materials: 'bg-orange-500',
    production: 'bg-blue-500',
    shipping: 'bg-cyan-500',
    marketing: 'bg-pink-500',
    salaries: 'bg-green-500',
    rent: 'bg-yellow-600',
    utilities: 'bg-purple-500',
    equipment: 'bg-indigo-500',
    other: 'bg-gray-500',
};

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

const defaultForm = { category: 'other', amount: 0, vat: 0, description: '', vendor: '', paymentMethod: '', date: new Date().toISOString().split('T')[0], notes: '' };

export default function ExpensesClient({ initialExpenses }: { initialExpenses: ExpenseItem[] }) {
    const [expenses, setExpenses] = useState(initialExpenses);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<ExpenseItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultForm);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filterCat, setFilterCat] = useState('all');

    const refresh = async () => {
        const data = await getExpenses(filterCat as any);
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
            amount: e.amount,
            vat: e.vat || 0,
            description: e.description,
            vendor: e.vendor || '',
            paymentMethod: e.paymentMethod || '',
            date: new Date(e.date).toISOString().split('T')[0],
            notes: e.notes || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.description || form.amount <= 0) {
            toast({ title: 'Error', description: 'Please fill required fields', type: 'error' });
            return;
        }
        setIsSaving(true);

        const payload = {
            category: form.category as any,
            amount: form.amount,
            vat: form.vat || 0,
            description: form.description,
            vendor: form.vendor || undefined,
            paymentMethod: form.paymentMethod ? form.paymentMethod as any : undefined,
            date: new Date(form.date),
            notes: form.notes || undefined,
        };

        const result = editItem
            ? await updateExpense(editItem.id, payload)
            : await createExpense(payload);

        setIsSaving(false);
        if (result.success) {
            toast({ title: 'Success', description: editItem ? 'Expense updated' : 'Expense created' });
            setModalOpen(false);
            refresh();
        } else {
            toast({ title: 'Error', description: result.error || 'Failed', type: 'error' });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        const result = await deleteExpense(deleteId);
        setIsDeleting(false);
        setDeleteId(null);
        if (result.success) refresh();
    };

    const filtered = filterCat === 'all' ? expenses : expenses.filter(e => e.category === filterCat);
    const total = filtered.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Select value={filterCat} onValueChange={(v) => { setFilterCat(v); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {filtered.length} expense{filtered.length !== 1 ? 's' : ''} · Total: <strong style={{ color: 'var(--text-primary)' }}>SAR {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                    </span>
                </div>
                <Button onClick={openCreate} className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
                    <Plus className="w-4 h-4 mr-2" /> Add Expense
                </Button>
            </div>

            {/* Table */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
                <div className="rounded-md border border-[var(--border)] overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--background)]">
                            <tr className="border-b border-[var(--border)]">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">ID</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Category</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Description</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Vendor</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-[var(--text-secondary)]">Amount</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Date</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">No expenses yet</td></tr>
                            ) : (
                                filtered.map(e => (
                                    <tr key={e.id} className="border-b border-[var(--border)] hover:bg-[var(--background)]/50">
                                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{e.expenseId}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={`${catColors[e.category] || 'bg-gray-500'} text-white`}>
                                                {e.category.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-primary)]">{e.description}</td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{e.vendor || '-'}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-red-500">-SAR {e.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(e.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEdit(e)} className="p-1.5 rounded-md hover:bg-[var(--background)] text-[var(--text-secondary)] hover:text-blue-500 transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-md hover:bg-[var(--background)] text-[var(--text-secondary)] hover:text-red-500 transition-colors">
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
                <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[var(--text-primary)]">{editItem ? 'Edit Expense' : 'New Expense'}</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            {editItem ? `Editing ${editItem.expenseId}` : 'Record a new business expense'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div>
                            <Label>Category *</Label>
                            <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Amount (SAR) *</Label>
                            <Input type="number" min={0} step={0.01} value={form.amount || ''} onChange={(e) => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
                        </div>
                        <div>
                            <Label>VAT (SAR)</Label>
                            <Input type="number" min={0} step={0.01} value={form.vat || ''} onChange={(e) => setForm(f => ({ ...f, vat: parseFloat(e.target.value) || 0 }))} placeholder="0.00 (15%)" />
                        </div>
                        <div>
                            <Label>Description *</Label>
                            <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this expense for?" />
                        </div>
                        <div>
                            <Label>Vendor</Label>
                            <Input value={form.vendor} onChange={(e) => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Supplier / vendor name" />
                        </div>
                        <div>
                            <Label>Payment Method</Label>
                            <Select value={form.paymentMethod || 'none'} onValueChange={(v) => setForm(f => ({ ...f, paymentMethod: v === 'none' ? '' : v }))}>
                                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Not specified</SelectItem>
                                    {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Date</Label>
                            <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional details..." className="min-h-[60px]" />
                        </div>

                        <Button onClick={handleSubmit} disabled={isSaving} className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
                            {isSaving ? 'Saving...' : editItem ? 'Save Changes' : 'Create Expense'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-[var(--card)] border-[var(--border)]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[var(--text-primary)]">Delete Expense?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[var(--text-secondary)]">
                            This will permanently delete this expense and its linked transaction record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-[var(--border)]">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
