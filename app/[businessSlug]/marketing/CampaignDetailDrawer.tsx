'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { Target, Users, Megaphone, DollarSign, MousePointerClick, TrendingUp, Handshake, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketingStore } from '@/stores/marketingStore';
import { updateCampaign, deleteCampaign } from '@/app/actions/marketing/campaigns';
import { CampaignStatus, CampaignChannel } from '@prisma/client';

export default function CampaignDetailDrawer({ campaign, onUpdated }: { campaign: any, onUpdated: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isDetailDrawerOpen, setIsDetailDrawerOpen, setSelectedCampaignId } = useMarketingStore();
    const [isSaving, setIsSaving] = useState(false);

    const [formState, setFormState] = useState({
        name: campaign?.name || '',
        status: campaign?.status || CampaignStatus.DRAFT,
        channel: campaign?.channel || CampaignChannel.OTHER,
        budget: campaign?.budget?.toString() || '0',
        reach: campaign?.reach?.toString() || '0',
        clicks: campaign?.clicks?.toString() || '0',
        leads: campaign?.leads?.toString() || '0',
        conversions: campaign?.conversions?.toString() || '0',
        spent: campaign?.spent?.toString() || '0',
        revenue: campaign?.revenue?.toString() || '0',
        notes: campaign?.notes || '',
    });

    useEffect(() => {
        if (campaign) {
            setFormState({
                name: campaign.name || '',
                status: campaign.status || CampaignStatus.DRAFT,
                channel: campaign.channel || CampaignChannel.OTHER,
                budget: campaign.budget?.toString() || '0',
                reach: campaign.reach?.toString() || '0',
                clicks: campaign.clicks?.toString() || '0',
                leads: campaign.leads?.toString() || '0',
                conversions: campaign.conversions?.toString() || '0',
                spent: campaign.spent?.toString() || '0',
                revenue: campaign.revenue?.toString() || '0',
                notes: campaign.notes || '',
            });
        }
    }, [campaign]);

    const handleChange = (field: string, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateCampaign(campaign.id, {
                ...formState,
                budget: parseFloat(formState.budget),
                reach: parseInt(formState.reach),
                clicks: parseInt(formState.clicks),
                leads: parseInt(formState.leads),
                conversions: parseInt(formState.conversions),
                spent: parseFloat(formState.spent),
                revenue: parseFloat(formState.revenue),
                startDate: new Date(campaign.startDate),
            });

            if (result.success) {
                toast({ title: 'Saved', description: 'Campaign updated successfully.' });
                onUpdated();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to update campaign', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Unexpected error', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        setIsSaving(true);
        try {
            const res = await deleteCampaign(campaign.id);
            if (res.success) {
                toast({ title: 'Deleted', description: 'Campaign removed.' });
                setIsDetailDrawerOpen(false);
                setSelectedCampaignId(null);
                onUpdated();
            } else {
                toast({ title: 'Error', description: res.error, type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Unexpected error', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!campaign) return null;

    const roi = parseFloat(formState.spent) > 0 ? ((parseFloat(formState.revenue) - parseFloat(formState.spent)) / parseFloat(formState.spent)) * 100 : 0;
    const isPositiveRoi = roi >= 0;

    return (
        <Sheet open={isDetailDrawerOpen} onOpenChange={setIsDetailDrawerOpen}>
            <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-2xl bg-[var(--background)] border-l border-[var(--border)] p-0 flex flex-col z-[50]">
                <SheetHeader className="sr-only">
                    <SheetTitle>Campaign Details</SheetTitle>
                </SheetHeader>

                {/* Header Profile */}
                <div className="p-8 pb-6 border-b border-[var(--border)] bg-[var(--card)]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--muted)]/50 border border-[var(--border)] flex items-center justify-center shadow-sm">
                                <Megaphone className="w-8 h-8 text-[var(--primary)]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{campaign.name}</h2>
                                <p className="text-sm font-bold text-[var(--text-secondary)]">{campaign.campaignId}</p>
                            </div>
                        </div>
                        <Select value={formState.status} onValueChange={(val) => handleChange('status', val)}>
                            <SelectTrigger className="w-40 bg-[var(--muted)]/30 border-[var(--border)] font-bold text-xs uppercase tracking-wider rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                {Object.values(CampaignStatus).map(s => (
                                    <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-8">
                        <div className="bg-[var(--muted)]/30 border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center">
                            <Users className="w-5 h-5 text-blue-500 mb-2" />
                            <p className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Reach</p>
                            <p className="text-xl font-black text-[var(--text-primary)]">{formState.reach}</p>
                        </div>
                        <div className="bg-[var(--muted)]/30 border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center">
                            <MousePointerClick className="w-5 h-5 text-cyan-500 mb-2" />
                            <p className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Clicks</p>
                            <p className="text-xl font-black text-[var(--text-primary)]">{formState.clicks}</p>
                        </div>
                        <div className="bg-[var(--muted)]/30 border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center">
                            <Target className="w-5 h-5 text-purple-500 mb-2" />
                            <p className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Leads</p>
                            <p className="text-xl font-black text-[var(--text-primary)]">{formState.leads}</p>
                        </div>
                        <div className="bg-[var(--muted)]/30 border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center">
                            <Handshake className="w-5 h-5 text-emerald-500 mb-2" />
                            <p className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-wider">Convs</p>
                            <p className="text-xl font-black text-[var(--text-primary)]">{formState.conversions}</p>
                        </div>
                    </div>
                </div>

                {/* Form Items */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[var(--background)]">
                    {/* Financials & ROI */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] border-b border-[var(--border)] pb-2">
                            <DollarSign className="w-4 h-4" /> Financials & ROI
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Budget (SAR)</Label>
                                <Input type="number" value={formState.budget} onChange={e => handleChange('budget', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Spent (SAR)</Label>
                                <Input type="number" value={formState.spent} onChange={e => handleChange('spent', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Revenue Attributed</Label>
                                <Input type="number" value={formState.revenue} onChange={e => handleChange('revenue', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-12 text-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Current ROI</Label>
                                <div className={cn("h-12 flex items-center px-4 rounded-xl border font-black text-lg", isPositiveRoi ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                                    {roi.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Updates */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] border-b border-[var(--border)] pb-2">
                            <TrendingUp className="w-4 h-4" /> Performance Updates
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Reach</Label>
                                <Input type="number" value={formState.reach} onChange={e => handleChange('reach', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Clicks</Label>
                                <Input type="number" value={formState.clicks} onChange={e => handleChange('clicks', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Leads</Label>
                                <Input type="number" value={formState.leads} onChange={e => handleChange('leads', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Conversions</Label>
                                <Input type="number" value={formState.conversions} onChange={e => handleChange('conversions', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-bold rounded-xl h-10" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-[var(--text-disabled)]">Notes</Label>
                        <Textarea value={formState.notes} onChange={e => handleChange('notes', e.target.value)} className="bg-[var(--card)] border-[var(--border)] font-medium rounded-xl min-h-[100px]" />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold uppercase tracking-widest text-[11px] rounded-xl h-12 px-6"
                    >
                        Delete Campaign
                    </Button>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDetailDrawerOpen(false)}
                            disabled={isSaving}
                            className="h-12 px-6 rounded-xl border-[var(--border)] font-bold uppercase tracking-widest text-[11px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px]"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
