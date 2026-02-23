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
import { Building2, Globe, MapPin, Briefcase, DollarSign, Layers, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewCompanyModal({ onCompanyAdded }: { onCompanyAdded: () => void }) {
    const { t, isRTL } = useTranslation();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast({ title: 'Error', description: 'Company name is required', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
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
                onCompanyAdded();
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
            <DialogContent className="max-w-4xl p-0 bg-[var(--card)] border-[var(--border)] overflow-hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Register New Company</DialogTitle>
                </DialogHeader>
                <div className={cn("grid grid-cols-1 md:grid-cols-5 h-full min-h-[500px]", isRTL ? "md:flex-row-reverse" : "")}>
                    {/* Left Side: context/summary */}
                    <div className="md:col-span-2 bg-[var(--muted)]/30 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--border)]">
                        <div className="space-y-6">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(232,168,56,0.1)]">
                                <Building2 className="w-7 h-7 text-[var(--primary)]" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Register Company</h2>
                                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                    Create a B2B profile to manage contracts, assign pricing tiers, and track lifetime value.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-10 border-t border-[var(--border)]">
                            <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                                Key Highlights
                            </div>
                            <ul className="space-y-3">
                                {[
                                    { icon: DollarSign, text: 'Tier-based wholesale pricing' },
                                    { icon: Globe, text: 'Custom category discounts' },
                                    { icon: Layers, text: 'CRM integration readiness' }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-[var(--text-secondary)]">
                                        <item.icon className="w-4 h-4 text-[var(--primary)]/60" />
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Side: form */}
                    <div className="md:col-span-3 p-10 space-y-8 max-h-[85vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-8 pb-10">
                            {/* Section 1: Core Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Company Identity
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Legal Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Half Million Cafe"
                                            className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)] transition-all font-bold"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            autoComplete="off"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="industry" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Industry</Label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-4 top-4 h-4 w-4 text-[var(--text-disabled)]" />
                                                <Input
                                                    id="industry"
                                                    placeholder="e.g. Coffee Retail"
                                                    className="pl-12 bg-[var(--muted)]/30 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)]"
                                                    value={industry}
                                                    onChange={(e) => setIndustry(e.target.value)}
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Operation City</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-4 h-4 w-4 text-[var(--text-disabled)]" />
                                                <Input
                                                    id="city"
                                                    placeholder="e.g. Riyadh"
                                                    className="pl-12 bg-[var(--muted)]/30 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)]"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="website" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Website URL</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-4 h-4 w-4 text-[var(--text-disabled)]" />
                                            <Input
                                                id="website"
                                                placeholder="e.g. example.com"
                                                className="pl-12 bg-[var(--muted)]/30 border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl focus:ring-1 focus:ring-[var(--primary)]"
                                                value={website}
                                                onChange={(e) => setWebsite(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Pricing Logic */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Categorized Pricing Tiers
                                </div>

                                <div className="bg-[var(--muted)]/20 rounded-2xl border border-[var(--border)] p-6 space-y-4">
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed italic border-l-2 border-[var(--primary)]/30 pl-4 mb-6">
                                        Assign specific discount tiers for each product category. If unassigned, "Standard Retail" will be applied.
                                    </p>

                                    <div className="grid gap-4">
                                        {activeCategories.length === 0 ? (
                                            <div className="text-xs font-bold p-4 bg-[var(--muted)]/50 rounded-xl text-[var(--text-disabled)] text-center border border-dashed border-[var(--border)]">
                                                No product categories available.
                                            </div>
                                        ) : (
                                            activeCategories.map(category => (
                                                <div key={category.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/20 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center text-[var(--text-disabled)] group-hover:text-[var(--primary)] transition-colors">
                                                            <Layers className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-sm font-black text-[var(--text-primary)] truncate max-w-[120px]">
                                                            {category.name}
                                                        </span>
                                                    </div>

                                                    <Select
                                                        value={categoryTiers[category.id] || 'none'}
                                                        onValueChange={(val) => setCategoryTiers(prev => ({ ...prev, [category.id]: val }))}
                                                    >
                                                        <SelectTrigger className="w-full sm:w-[200px] bg-[var(--muted)]/50 border-[var(--border)] text-[var(--text-primary)] h-10 rounded-lg focus:ring-1 focus:ring-[var(--primary)]">
                                                            <SelectValue placeholder="Standard Retail" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                                            <SelectItem value="none" className="text-xs font-bold text-[var(--text-muted)]">Standard Retail</SelectItem>
                                                            {activeTiers.filter(t => t.categoryId === category.id || (!t.categoryId && t.isGlobal)).map(tier => (
                                                                <SelectItem key={tier.id} value={tier.id} className="text-xs font-bold">
                                                                    {tier.tierName}
                                                                    <span className="ml-2 opacity-50 font-normal">({tier.pricePerKg} SAR/kg)</span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsNewCompanyModalOpen(false)}
                                    disabled={isSaving}
                                    className="border-[var(--border)] text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl hover:bg-[var(--muted)]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-[#E8A838] text-black hover:bg-[#d69628] font-black uppercase tracking-widest text-[10px] h-12 px-10 rounded-xl shadow-xl shadow-[#E8A838]/20 transition-all active:scale-95"
                                >
                                    {isSaving ? 'Registering...' : 'Complete Registration'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
