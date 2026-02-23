'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCrmStore, CompanyPricingTier } from '@/stores/crmStore';
import { formatCurrency, cn } from '@/lib/utils';
import { Building2, MapPin, Globe, CreditCard, Mail, Phone, Users, ArrowRight, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';

export default function CompanyDetailDrawer() {
    const { t, isRTL } = useTranslation();
    const { isCompanyDrawerOpen, setIsCompanyDrawerOpen, selectedCompany } = useCrmStore();

    if (!selectedCompany) return null;

    return (
        <Sheet open={isCompanyDrawerOpen} onOpenChange={setIsCompanyDrawerOpen}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-[var(--card)] border-l border-[var(--border)] p-0 space-y-0" side={isRTL ? "left" : "right"}>
                {/* Header Section */}
                <div className="p-10 border-b border-[var(--border)] bg-[var(--muted)]/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                        <Building2 size={120} />
                    </div>

                    <div className={cn("space-y-6 relative z-10", isRTL ? "text-right" : "")}>
                        <div className={cn("flex items-start justify-between gap-4", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center shadow-lg">
                                <Building2 className="w-8 h-8 text-[var(--primary)]" />
                            </div>
                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] hover:bg-[var(--muted)]">
                                Edit Profile
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                <SheetTitle className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                                    {selectedCompany.name}
                                </SheetTitle>
                                {selectedCompany.industry && (
                                    <Badge variant="secondary" className="bg-[var(--primary)]/10 text-[var(--primary)] border-0 font-black uppercase text-[10px] tracking-widest px-3 py-1">
                                        {selectedCompany.industry}
                                    </Badge>
                                )}
                            </div>

                            <div className={cn("flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]", isRTL ? "flex-row-reverse" : "")}>
                                {selectedCompany.city && (
                                    <div className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors">
                                        <MapPin className="h-3.5 w-3.5 text-[var(--primary)]/60" />
                                        {selectedCompany.city}
                                    </div>
                                )}
                                {selectedCompany.website && (
                                    <a href={selectedCompany.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                                        <Globe className="h-3.5 w-3.5 text-[var(--primary)]/60" />
                                        {new URL(selectedCompany.website).hostname.replace('www.', '')}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-12">
                    {/* 1. Impact Metrics */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-[var(--muted)]/20 rounded-2xl p-6 border border-[var(--border)] group hover:border-[var(--primary)]/30 transition-all">
                            <div className={cn("flex items-center gap-3 mb-4", isRTL ? "flex-row-reverse" : "")}>
                                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                                    <DollarSign className="w-4 h-4 text-[var(--primary)]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Lifetime Value</span>
                            </div>
                            <div className={cn("text-3xl font-black text-[var(--text-primary)] tracking-tight", isRTL ? "text-right" : "")}>
                                {formatCurrency(selectedCompany.lifetimeValue)}
                            </div>
                        </div>

                        <div className="bg-[var(--muted)]/20 rounded-2xl p-6 border border-[var(--border)] group hover:border-[#3b82f6]/30 transition-all">
                            <div className={cn("flex items-center gap-3 mb-4", isRTL ? "flex-row-reverse" : "")}>
                                <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-[#3b82f6]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Active Contacts</span>
                            </div>
                            <div className={cn("text-3xl font-black text-[var(--text-primary)] tracking-tight", isRTL ? "text-right" : "")}>
                                {selectedCompany._count?.contacts || 0}
                            </div>
                        </div>
                    </div>

                    {/* 2. Specialized Pricing Sections */}
                    <div className="space-y-6">
                        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-1.5 h-6 bg-[var(--primary)] rounded-full" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Pricing Logic</h3>
                        </div>

                        <div className="bg-[var(--muted)]/10 border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
                            {selectedCompany.pricingTiers && selectedCompany.pricingTiers.length > 0 ? (
                                selectedCompany.pricingTiers.map((tier: CompanyPricingTier) => (
                                    <div key={tier.id} className={cn("p-6 flex items-center justify-between hover:bg-[var(--muted)]/20 transition-all", isRTL ? "flex-row-reverse" : "")}>
                                        <div className={cn("space-y-1", isRTL ? "text-right" : "")}>
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-muted)]">{tier.categoryName}</span>
                                            <div className="text-sm font-bold text-[var(--text-primary)]">{tier.tierName}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-[var(--primary)] bg-[var(--primary)]/5 px-3 py-1.5 rounded-lg border border-[var(--primary)]/20">
                                                {tier.pricePerKg} SAR/kg
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center space-y-2 opacity-50">
                                    <DollarSign className="w-8 h-8 mx-auto text-[var(--text-disabled)] mb-4" />
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Standard Retail Applied</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. CRM Quick Navigation */}
                    <div className="space-y-6">
                        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-1.5 h-6 bg-[#3b82f6] rounded-full" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">CRM Insights</h3>
                        </div>

                        <div className="grid gap-4">
                            <Button
                                variant="outline"
                                className={cn("w-full h-16 justify-between px-6 rounded-2xl border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 group transition-all", isRTL ? "flex-row-reverse" : "")}
                            >
                                <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                                    <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/5 flex items-center justify-center group-hover:bg-[#3b82f6]/10 transition-colors">
                                        <Users className="w-5 h-5 text-[#3b82f6]" />
                                    </div>
                                    <div className={cn("text-left space-y-0.5", isRTL ? "text-right" : "")}>
                                        <div className="text-[13px] font-black text-[var(--text-primary)] group-hover:text-[#3b82f6] transition-colors uppercase tracking-tight">View All Contacts</div>
                                        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Manage personas at {selectedCompany.name}</div>
                                    </div>
                                </div>
                                <ArrowRight className={cn("w-4 h-4 text-[var(--text-disabled)] group-hover:translate-x-1 group-hover:text-[#3b82f6] transition-all", isRTL ? "rotate-180 group-hover:translate-x-[-4px]" : "")} />
                            </Button>

                            <Button
                                variant="outline"
                                className={cn("w-full h-16 justify-between px-6 rounded-2xl border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 group transition-all", isRTL ? "flex-row-reverse" : "")}
                            >
                                <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/5 flex items-center justify-center group-hover:bg-purple-500/10 transition-colors">
                                        <CreditCard className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div className={cn("text-left space-y-0.5", isRTL ? "text-right" : "")}>
                                        <div className="text-[13px] font-black text-[var(--text-primary)] group-hover:text-purple-500 transition-colors uppercase tracking-tight">Active Pipepline</div>
                                        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{selectedCompany._count?.deals || 0} Deals in progress</div>
                                    </div>
                                </div>
                                <ArrowRight className={cn("w-4 h-4 text-[var(--text-disabled)] group-hover:translate-x-1 group-hover:text-purple-500 transition-all", isRTL ? "rotate-180 group-hover:translate-x-[-4px]" : "")} />
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
