'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
    Megaphone,
    DollarSign,
    Target,
    Activity,
    Search,
    Plus,
} from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useQuery } from '@tanstack/react-query';
import { getMarketingOverview, getCampaigns } from '@/app/actions/marketing/campaigns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketingStore } from '@/stores/marketingStore';
import NewCampaignModal from './NewCampaignModal';
import CampaignDetailDrawer from './CampaignDetailDrawer';
import { CampaignChannel, CampaignStatus } from '@prisma/client';

export default function MarketingOverviewClient({ data: initialData, initialCampaigns, businessSlug }: { data: any, initialCampaigns: any[], businessSlug: string }) {
    const { t, isRTL } = useTranslation();
    const { setIsNewCampaignModalOpen, setSelectedCampaignId, setIsDetailDrawerOpen, selectedCampaignId } = useMarketingStore();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [channelFilter, setChannelFilter] = useState<string>('ALL');

    const { data: overview, refetch: refetchOverview } = useQuery({
        queryKey: ['marketing-overview', businessSlug],
        queryFn: () => getMarketingOverview(businessSlug),
        initialData,
        staleTime: 10_000,
        refetchInterval: 30_000,
    });

    const { data: campaigns, refetch: refetchCampaigns } = useQuery({
        queryKey: ['campaigns', businessSlug, search, statusFilter, channelFilter],
        queryFn: () => getCampaigns(businessSlug, search, statusFilter, channelFilter),
        initialData: initialCampaigns,
        staleTime: 10_000,
        refetchInterval: 30_000,
    });

    const refreshData = () => {
        refetchOverview();
        refetchCampaigns();
    };

    const handleRowClick = (id: string) => {
        setSelectedCampaignId(id);
        setIsDetailDrawerOpen(true);
    };

    const kpis = [
        {
            title: 'Total Budget (Active)',
            value: overview?.totalBudget || 0,
            prefix: 'SAR ',
            icon: <DollarSign className="w-5 h-5 text-blue-400" />,
            color: "text-blue-400",
            bg: "bg-blue-400/5",
            border: "border-blue-400/10"
        },
        {
            title: 'Total Spent',
            value: overview?.totalSpent || 0,
            prefix: 'SAR ',
            icon: <Activity className="w-5 h-5 text-emerald-400" />,
            color: "text-emerald-400",
            bg: "bg-emerald-400/5",
            border: "border-emerald-400/10"
        },
        {
            title: 'Total Leads',
            value: overview?.totalLeads || 0,
            icon: <Target className="w-5 h-5 text-purple-400" />,
            color: "text-purple-400",
            bg: "bg-purple-400/5",
            border: "border-purple-400/10"
        },
        {
            title: 'Avg ROI',
            value: overview?.roi || 0,
            suffix: '%',
            icon: <Megaphone className="w-5 h-5 text-amber-500" />,
            color: (overview?.roi || 0) >= 0 ? "text-emerald-500" : "text-amber-500",
            bg: "bg-amber-400/5",
            border: "border-amber-400/10"
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'DRAFT': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
            case 'PAUSED': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'COMPLETED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    const getChannelBadge = (channel: string) => {
        const colors: Record<string, string> = {
            INSTAGRAM: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
            TIKTOK: 'bg-black/10 text-black border-black/20 dark:bg-white/10 dark:text-white dark:border-white/20',
            SNAPCHAT: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
            GOOGLE_ADS: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            EMAIL: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            WHATSAPP: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
        return colors[channel] || 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    };

    const selectedCampaign = campaigns?.find(c => c.id === selectedCampaignId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 pt-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Marketing Campaigns</h1>
                    <p className="text-sm text-[var(--text-disabled)] mt-1">Track ads, measure ROI, and optimize channels.</p>
                </div>
                <PermissionGuard module="marketing" action="create">
                    <Button
                        onClick={() => setIsNewCampaignModalOpen(true)}
                        className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[var(--primary)]/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Campaign
                    </Button>
                </PermissionGuard>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
                {kpis.map((kpi, i) => (
                    <Card key={i} className="p-6 border-[var(--border)] bg-[var(--card)] rounded-2xl hover:border-[var(--primary)]/40 transition-all border-b-4 border-b-transparent hover:border-b-[var(--primary)] shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{kpi.title}</p>
                                <h3 className={cn("text-2xl font-black tracking-tight", kpi.color)}>
                                    {kpi.prefix}{typeof kpi.value === 'number' ? kpi.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : kpi.value}{kpi.suffix}
                                </h3>
                            </div>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", kpi.bg, kpi.border)}>
                                {kpi.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Toolbar & Table */}
            <div className="px-6">
                <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/10 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
                            <Input
                                placeholder="Search campaigns..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10 bg-[var(--card)] border-[var(--border)] rounded-xl font-medium focus:ring-[var(--primary)]"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-10 bg-[var(--card)] border-[var(--border)] rounded-xl font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                    <SelectItem value="ALL" className="font-bold text-xs">All Statuses</SelectItem>
                                    {Object.values(CampaignStatus).map(s => (
                                        <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={channelFilter} onValueChange={setChannelFilter}>
                                <SelectTrigger className="w-[140px] h-10 bg-[var(--card)] border-[var(--border)] rounded-xl font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                    <SelectValue placeholder="Channel" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                    <SelectItem value="ALL" className="font-bold text-xs">All Channels</SelectItem>
                                    {Object.values(CampaignChannel).map(c => (
                                        <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border)]/50 bg-[var(--muted)]/5">
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Campaign</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Status</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Channel</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-left" : "text-right")}>Budget</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Spent</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-left" : "text-right")}>ROI</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Start Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]/20">
                                {campaigns?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <p className="text-sm font-bold text-[var(--text-disabled)]">No campaigns found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns?.map((campaign: any) => {
                                        const cSpent = parseFloat(campaign.spent || 0);
                                        const cBudget = parseFloat(campaign.budget || 0);
                                        const cRev = parseFloat(campaign.revenue || 0);
                                        const spentPct = cBudget > 0 ? (cSpent / cBudget) * 100 : 0;
                                        const roi = cSpent > 0 ? ((cRev - cSpent) / cSpent) * 100 : 0;

                                        return (
                                            <tr
                                                key={campaign.id}
                                                onClick={() => handleRowClick(campaign.id)}
                                                className="group hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{campaign.name}</p>
                                                        <p className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-wider mt-0.5">{campaign.campaignId}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn("px-2.5 py-1 rounded-md text-[9px] font-black uppercase border", getStatusColor(campaign.status))}>
                                                        {campaign.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn("px-2.5 py-1 rounded-md text-[9px] font-black uppercase border", getChannelBadge(campaign.channel))}>
                                                        {campaign.channel.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4" style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                                    <span className="text-sm font-black text-[var(--text-primary)]">SAR {cBudget.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                                            <span className="text-[var(--text-secondary)]">SAR {cSpent.toLocaleString()}</span>
                                                            <span className="text-[var(--text-disabled)]">{spentPct.toFixed(0)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[var(--muted)]/50 rounded-full overflow-hidden">
                                                            <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${Math.min(spentPct, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4" style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                                    <span className={cn("text-sm font-black", roi >= 0 ? "text-emerald-500" : "text-amber-500")}>
                                                        {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                                                        {new Date(campaign.startDate).toLocaleDateString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <NewCampaignModal onCampaignAdded={refreshData} />
            <CampaignDetailDrawer key={selectedCampaign?.id} campaign={selectedCampaign} onUpdated={refreshData} />
        </div>
    );
}
