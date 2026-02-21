'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useCrmStore } from '@/stores/crmStore';
import { createCompany } from '@/app/actions/crm/companies';
import { useTranslation } from '@/lib/i18n';

export default function NewCompanyModal({ onCompanyAdded }: { onCompanyAdded: () => void }) {
    const { t } = useTranslation();
    const { isNewCompanyModalOpen, setIsNewCompanyModalOpen, activeTiers, activeCategories } = useCrmStore();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [industry, setIndustry] = useState('');
    const [city, setCity] = useState('');
    const [website, setWebsite] = useState('');
    const [categoryTiers, setCategoryTiers] = useState<Record<string, string>>({});

    const resetForm = () => {
        setName('');
        setIndustry('');
        setCity('');
        setWebsite('');
        setCategoryTiers({});
    };

    const calculateMarginColor = (marginPercent: number) => {
        if (marginPercent >= 90) return 'text-green-600 bg-green-50';
        if (marginPercent >= 80) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast({ title: 'Error', description: 'Company name is required', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            // Convert Record<string, string> to Array format for Prisma
            const pricingTiersArray = Object.entries(categoryTiers)
                .filter(([_, tierId]) => tierId !== 'none')
                .map(([catId, tierId]) => ({
                    categoryId: catId,
                    pricingTierId: tierId
                }));

            const result = await createCompany({
                name,
                industry: industry || undefined,
                city: city || undefined,
                website: website || undefined,
                pricingTiers: pricingTiersArray
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Company added successfully' });
                setIsNewCompanyModalOpen(false);
                resetForm();
                onCompanyAdded(); // Trigger immediate refresh from parent
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to add company', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isNewCompanyModalOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsNewCompanyModalOpen(open);
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Company</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Company Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Half Million Cafe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Input
                                id="industry"
                                placeholder="e.g. Coffee Shop"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                placeholder="e.g. Riyadh"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="text"
                            placeholder="e.g. example.com"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Category-Specific Pricing Tiers</Label>
                        <p className="text-xs text-gray-500 mb-2">Assign wholesale pricing discounts to this company based on specific product categories.</p>

                        <div className="space-y-2 pr-2 overflow-visible">
                            {activeCategories.length === 0 ? (
                                <div className="text-sm italic p-2 border rounded" style={{ background: 'var(--muted)', color: 'var(--text-muted)' }}>No categories found in the system.</div>
                            ) : (
                                activeCategories.map(category => (
                                    <div key={category.id} className="grid grid-cols-[1fr_2fr] items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700 truncate" title={category.name}>
                                            {category.name}
                                        </span>
                                        <Select
                                            value={categoryTiers[category.id] || 'none'}
                                            onValueChange={(val) => setCategoryTiers(prev => ({ ...prev, [category.id]: val }))}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Standard Retail" />
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] max-h-[8rem] z-[100]">
                                                <SelectItem value="none">Standard Retail</SelectItem>
                                                {activeTiers.filter(t => t.categoryId === category.id || (!t.categoryId && t.isGlobal)).map(tier => (
                                                    <SelectItem key={tier.id} value={tier.id}>
                                                        {tier.tierName} ({tier.pricePerKg} SAR/kg)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsNewCompanyModalOpen(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-[#E8A838] text-black hover:bg-[#d69628]"
                        >
                            {isSaving ? 'Saving...' : 'Add Company'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
