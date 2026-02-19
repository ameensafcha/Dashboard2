'use client';

import { useState } from 'react';
import { Category } from '@prisma/client';
import { PricingTierWithCategory } from '@/app/actions/pricing';
import { Button } from '@/components/ui/button';
import { PricingTierDialog } from './PricingTierDialog';
import { cn } from '@/lib/utils';

interface PricingPageContentProps {
    categories: Category[];
    initialTiers: PricingTierWithCategory[];
}

export function PricingPageContent({ categories, initialTiers }: PricingPageContentProps) {
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
            <div className="text-center py-12">
                <p style={{ color: 'var(--text-muted)' }}>No categories found. Please create categories first.</p>
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
                            "px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all border",
                            activeCategoryId === category.id
                                ? "bg-[#E8A838] text-black border-[#E8A838] shadow-sm"
                                : "bg-background text-muted-foreground border-border hover:bg-secondary/50 hover:text-foreground"
                        )}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleAddNew}
                    className="bg-[#E8A838] hover:bg-[#d49a2d] text-black"
                >
                    Add Tier
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
            <div>
                {filteredTiers.length === 0 ? (
                    <div className="text-center py-12 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No pricing tiers for this category</p>
                    </div>
                ) : (
                    <div className="rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                        <table className="w-full">
                            <thead className="" style={{ background: 'var(--muted)' }}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Tier Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Min Order (kg)</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Max Order (kg)</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Price/kg</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Discount</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTiers.map((tier) => (
                                    <tr key={tier.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                        <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{tier.tierName}</td>
                                        <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{tier.minOrderKg.toString()}</td>
                                        <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                                            {tier.maxOrderKg ? tier.maxOrderKg.toString() : '-'}
                                        </td>
                                        <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>SAR {tier.pricePerKg.toString()}</td>
                                        <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{tier.discountPercent.toString()}%</td>
                                        <td className="px-4 py-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="cursor-pointer hover:bg-[#E8A838]/20 hover:text-[#E8A838]"
                                                onClick={() => handleEdit(tier)}
                                            >
                                                Edit
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
