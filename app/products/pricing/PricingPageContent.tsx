'use client';

import { useState } from 'react';
import { Category } from '@prisma/client';
import { PricingTierWithCategory } from '@/app/actions/pricing';
import { Button } from '@/components/ui/button';
import { PricingTierDialog } from './PricingTierDialog';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { Layers, Plus, Edit2, AlertCircle } from 'lucide-react';

interface PricingPageContentProps {
    categories: Category[];
    initialTiers: PricingTierWithCategory[];
}

export function PricingPageContent({ categories, initialTiers }: PricingPageContentProps) {
    const { t, isRTL } = useTranslation();
    const [activeCategoryId, setActiveCategoryId] = useState<string>(
        categories.length > 0 ? categories[0].id : ''
    );
    const [editingTier, setEditingTier] = useState<PricingTierWithCategory | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const filteredTiers = initialTiers.filter(
        (tier) => tier.categoryId === activeCategoryId
    );

    const handleEdit = (tier: PricingTierWithCategory) => {
        setEditingTier(tier);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingTier(null);
        setIsDialogOpen(true);
    };

    if (categories.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-[var(--muted)]/20" style={{ borderColor: 'var(--border)' }}>
                <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4 border shadow-inner" style={{ borderColor: 'var(--border)' }}>
                    <AlertCircle className="w-8 h-8 opacity-40 text-[var(--text-secondary)]" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-[var(--text-primary)]">{t.noCategoriesYet}</h3>
                <p className="text-sm max-w-xs mx-auto text-[var(--text-secondary)]">{t.addFirstCategory}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Category Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategoryId(category.id)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border shadow-sm",
                            activeCategoryId === category.id
                                ? "bg-[#E8A838] text-black border-[#E8A838] shadow-md scale-105"
                                : "bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--muted)] hover:text-[var(--text-primary)]"
                        )}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleAddNew}
                    className="bg-[#E8A838] hover:bg-[#d49a2d] text-black shadow-md transition-all active:scale-95 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {t.addTier}
                </Button>
                <PricingTierDialog
                    key={editingTier?.id ?? 'new'}
                    categories={categories}
                    defaultCategoryId={activeCategoryId}
                    tierToEdit={editingTier}
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                />
            </div>

            {/* Pricing Tiers Table */}
            <div className="overflow-hidden">
                {filteredTiers.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-[var(--muted)]/20 shadow-sm" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4 border shadow-inner" style={{ borderColor: 'var(--border)' }}>
                            <Layers className="w-8 h-8 opacity-40 text-[var(--text-secondary)]" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1 text-[var(--text-primary)]">{t.noTiersForCategory || 'No pricing tiers for this category'}</h3>
                        <p className="text-sm max-w-xs mx-auto text-[var(--text-secondary)]">{t.addFirstProduct || 'Add your first tier to get started'}</p>
                        <Button
                            onClick={handleAddNew}
                            variant="outline"
                            className="mt-6 border-[#E8A838] text-[#E8A838] hover:bg-[#E8A838]/10"
                        >
                            {t.addTier}
                        </Button>
                    </div>
                ) : (
                    <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                        <table className="w-full">
                            <thead style={{ background: 'var(--muted)' }}>
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{t.tierName}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{t.minOrder}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{t.maxOrder}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{t.pricePerKg}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{t.discount}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {filteredTiers.map((tier) => (
                                    <tr
                                        key={tier.id}
                                        className="hover:bg-[var(--muted)]/40 transition-colors group cursor-pointer"
                                        onClick={() => handleEdit(tier)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{tier.tierName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{tier.minOrderKg.toString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                            {tier.maxOrderKg ? tier.maxOrderKg.toString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--accent-gold)]">SAR {tier.pricePerKg.toString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                            <span className="px-2 py-1 rounded-full bg-[var(--muted)] text-[var(--text-primary)] text-xs font-bold">
                                                {tier.discountPercent.toString()}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#E8A838]/20 hover:text-[#E8A838] gap-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(tier);
                                                }}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                {t.edit}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
