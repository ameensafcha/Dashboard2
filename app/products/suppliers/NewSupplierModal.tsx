'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { createSupplier } from '@/app/actions/suppliers-create';

interface NewSupplierModalProps {
    onSuccess: (supplier: any) => void;
}

export default function NewSupplierModal({ onSuccess }: NewSupplierModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSave = async () => {
        if (!formData.name) {
            setError('Supplier Name is required.');
            return;
        }

        setIsSaving(true);
        setError(null);

        const result = await createSupplier(formData);

        setIsSaving(false);

        if (result.success) {
            setIsOpen(false);
            onSuccess({
                id: result.id,
                ...formData,
                isActive: true
            });
            setFormData({
                name: '',
                contactPerson: '',
                email: '',
                phone: '',
                address: '',
                notes: ''
            });
        } else {
            setError(result.error || 'Failed to add supplier');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
                    <Plus className="mr-2 h-4 w-4" />
                    New Supplier
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-[var(--text-primary)]">Add New Supplier</DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)]">
                        Register a new vendor or raw material provider.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Supplier Name <span className="text-red-500">*</span></Label>
                        <Input
                            placeholder="e.g. Al Safi Plastics"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="bg-[var(--background)] border-[var(--border)]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Contact Person</Label>
                            <Input
                                placeholder="e.g. Ahmed"
                                value={formData.contactPerson}
                                onChange={(e) => handleChange('contactPerson', e.target.value)}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                placeholder="+966 50..."
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="bg-[var(--background)] border-[var(--border)]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            placeholder="sales@supplier.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="bg-[var(--background)] border-[var(--border)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Address / Region</Label>
                        <Input
                            placeholder="e.g. Riyadh Industrial Area"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            className="bg-[var(--background)] border-[var(--border)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Internal Notes</Label>
                        <Textarea
                            placeholder="Special terms, lead times, or notes..."
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            className="bg-[var(--background)] border-[var(--border)] min-h-[80px]"
                        />
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
                        {isSaving ? 'Saving...' : 'Add Supplier'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
