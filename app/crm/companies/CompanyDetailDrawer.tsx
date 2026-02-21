'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCrmStore, CompanyPricingTier } from '@/stores/crmStore';
import { formatCurrency } from '@/lib/utils';
import { Building2, MapPin, Globe, CreditCard, Mail, Phone, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';

export default function CompanyDetailDrawer() {
    const { t } = useTranslation();
    const { isCompanyDrawerOpen, setIsCompanyDrawerOpen, selectedCompany } = useCrmStore();

    if (!selectedCompany) return null;

    return (
        <Sheet open={isCompanyDrawerOpen} onOpenChange={setIsCompanyDrawerOpen}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto" side="right">
                <SheetHeader className="pb-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <SheetTitle className="text-2xl font-bold">{selectedCompany.name}</SheetTitle>
                                {selectedCompany.industry && (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-normal">
                                        {selectedCompany.industry}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 mt-2">
                                {selectedCompany.city && (
                                    <div className="flex items-center gap-1.5 hover:text-gray-900 transition-colors cursor-default">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {selectedCompany.city}
                                    </div>
                                )}
                                {selectedCompany.website && (
                                    <a href={selectedCompany.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                                        <Globe className="h-3.5 w-3.5" />
                                        {new URL(selectedCompany.website).hostname.replace('www.', '')}
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <Button variant="outline" size="sm" className="h-8">
                                Edit Company
                            </Button>
                        </div>
                    </div>
                </SheetHeader>

                <div className="py-6 space-y-8">
                    {/* Quick Stats Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Lifetime Value</div>
                            <div className="text-2xl font-semibold text-gray-900">{formatCurrency(selectedCompany.lifetimeValue)}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Pricing Tiers</div>
                            <div className="mt-1 flex flex-col gap-2">
                                {selectedCompany.pricingTiers && selectedCompany.pricingTiers.length > 0 ? (
                                    selectedCompany.pricingTiers.map((tier: CompanyPricingTier) => (
                                        <div key={tier.id} className="flex flex-col gap-0.5 border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                            <span className="text-xs font-semibold text-gray-700">{tier.categoryName}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 text-sm">{tier.tierName}</span>
                                                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full w-fit border border-green-100">
                                                    {tier.pricePerKg} SAR/kg
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-500 italic">Standard Retail</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Linked Contacts Section preview */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                Contacts at {selectedCompany.name} ({selectedCompany._count?.contacts || 0})
                            </h3>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[#E8A838]">View All in CRM</Button>
                        </div>

                        {selectedCompany._count?.contacts === 0 ? (
                            <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6 text-center">
                                <p className="text-sm text-gray-500 mb-3">No contacts have been linked to this company yet.</p>
                                <Button variant="outline" size="sm">Add Contact</Button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-500 italic">Contacts list view will be populated when Section 3.3 is built...</p>
                            </div>
                        )}
                    </div>

                    {/* Linked Deals Section preview */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-gray-400" />
                                Active Deals ({selectedCompany._count?.deals || 0})
                            </h3>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[#E8A838]">View Pipeline</Button>
                        </div>

                        {selectedCompany._count?.deals === 0 ? (
                            <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">No active deals.</div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Deals view will be populated when Section 3.4 is built...</p>
                        )}
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    );
}
