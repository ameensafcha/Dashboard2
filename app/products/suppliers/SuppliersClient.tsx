'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { updateSupplier, deleteSupplier } from '@/app/actions/suppliers';
import NewSupplierModal from './NewSupplierModal';

interface Props {
    initialSuppliers: any[];
}

export default function SuppliersClient({ initialSuppliers }: Props) {
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit state
    const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '', notes: '' });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete state
    const [deletingSupplier, setDeletingSupplier] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const openEdit = (supplier: any) => {
        setEditingSupplier(supplier);
        setEditForm({
            name: supplier.name || '',
            contactPerson: supplier.contactPerson || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            notes: supplier.notes || '',
        });
    };

    const handleSaveEdit = async () => {
        if (!editingSupplier || !editForm.name) return;
        setIsSavingEdit(true);
        const result = await updateSupplier(editingSupplier.id, {
            name: editForm.name,
            contactPerson: editForm.contactPerson || null,
            email: editForm.email || null,
            phone: editForm.phone || null,
            address: editForm.address || null,
            notes: editForm.notes || null,
        });
        setIsSavingEdit(false);
        if (result.success) {
            setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? { ...s, ...editForm } : s));
            setEditingSupplier(null);
        }
    };

    const handleDelete = async () => {
        if (!deletingSupplier) return;
        setIsDeleting(true);
        const result = await deleteSupplier(deletingSupplier.id);
        setIsDeleting(false);
        if (result.success) {
            setSuppliers(prev => prev.filter(s => s.id !== deletingSupplier.id));
            setDeletingSupplier(null);
        }
    };

    const handleToggleActive = async (supplier: any) => {
        const newStatus = !supplier.isActive;
        const result = await updateSupplier(supplier.id, { isActive: newStatus });
        if (result.success) {
            setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, isActive: newStatus } : s));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <PageHeader title="Suppliers" />
                    <p className="text-[var(--text-secondary)] text-sm -mt-1 mb-2">
                        Manage raw material and packaging suppliers.
                    </p>
                </div>
                <NewSupplierModal onSuccess={(newSupplier) => setSuppliers([newSupplier, ...suppliers])} />
            </div>

            <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
                <div className="flex mb-6">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
                        <Input
                            placeholder="Search suppliers..."
                            className="pl-9 bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border border-[var(--border)] overflow-hidden">
                    <Table>
                        <TableHeader className="bg-[var(--background)]">
                            <TableRow className="border-b-[var(--border)] hover:bg-transparent">
                                <TableHead className="text-[var(--text-secondary)]">Name</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Contact Person</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Email / Phone</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Status</TableHead>
                                <TableHead className="text-[var(--text-secondary)] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSuppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-[var(--text-muted)]">
                                        No suppliers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <TableRow key={supplier.id} className="border-b-[var(--border)] hover:bg-[var(--background)]/50">
                                        <TableCell className="font-medium text-[var(--text-primary)]">
                                            {supplier.name}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-secondary)]">
                                            {supplier.contactPerson || '-'}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-secondary)]">
                                            <div className="flex flex-col text-sm">
                                                <span>{supplier.email || '-'}</span>
                                                <span className="text-xs text-[var(--text-muted)]">{supplier.phone || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={`cursor-pointer transition-colors ${supplier.isActive ? 'bg-[#2D6A4F] text-white hover:bg-[#2D6A4F]/70' : 'bg-gray-400 text-white hover:bg-gray-500'}`}
                                                onClick={() => handleToggleActive(supplier)}
                                            >
                                                {supplier.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                    onClick={() => openEdit(supplier)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[var(--text-muted)] hover:text-red-500"
                                                    onClick={() => setDeletingSupplier(supplier)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Edit Supplier Dialog */}
            <Dialog open={!!editingSupplier} onOpenChange={(open) => { if (!open) setEditingSupplier(null); }}>
                <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-[var(--text-primary)]">Edit Supplier</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            Update the supplier details below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Supplier Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Contact Person</Label>
                                <Input
                                    value={editForm.contactPerson}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                                    className="bg-[var(--background)] border-[var(--border)]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="bg-[var(--background)] border-[var(--border)]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Address / Region</Label>
                            <Input
                                value={editForm.address}
                                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Internal Notes</Label>
                            <Textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="bg-[var(--background)] border-[var(--border)] min-h-[80px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingSupplier(null)} disabled={isSavingEdit}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                            onClick={handleSaveEdit}
                            disabled={isSavingEdit || !editForm.name}
                        >
                            {isSavingEdit ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingSupplier} onOpenChange={(open) => { if (!open) setDeletingSupplier(null); }}>
                <AlertDialogContent className="bg-[var(--card)] border-[var(--border)]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[var(--text-primary)]">Delete Supplier?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[var(--text-secondary)]">
                            Are you sure you want to delete <strong>{deletingSupplier?.name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
