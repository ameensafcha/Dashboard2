'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
    Target,
    Activity,
    TrendingUp,
    Search,
    Plus,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useQuery } from '@tanstack/react-query';
import { getGoalsOverview, getGoals } from '@/app/actions/strategy/goals';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStrategyStore } from '@/stores/strategyStore';
import NewGoalModal from './NewGoalModal';
import GoalDetailDrawer from './GoalDetailDrawer';
import { ObjectiveStatus, StrategyType } from '@prisma/client';

interface StrategyOverviewProps {
    initialOverview: { total: number; onTrack: number; atRisk: number; achieved: number; };
    initialGoals: any[];
    businessSlug: string;
}

export default function StrategyOverviewClient({ initialOverview, initialGoals, businessSlug }: StrategyOverviewProps) {
    const { t, isRTL } = useTranslation();
    const { setIsNewGoalModalOpen, setSelectedGoalId, setIsDetailDrawerOpen } = useStrategyStore();

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const { data: overview, refetch: refetchOverview } = useQuery({
        queryKey: ['goals-overview', businessSlug],
        queryFn: () => getGoalsOverview(businessSlug),
        initialData: initialOverview,
        staleTime: 10_000,
        refetchInterval: 30_000,
    });

    const { data: goals, refetch: refetchGoals } = useQuery({
        queryKey: ['goals', businessSlug, typeFilter, statusFilter],
        queryFn: () => getGoals(businessSlug, typeFilter, statusFilter),
        initialData: initialGoals,
        staleTime: 10_000,
        refetchInterval: 30_000,
    });

    const refreshData = () => {
        refetchOverview();
        refetchGoals();
    };

    const handleRowClick = (id: string, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        setSelectedGoalId(id);
        setIsDetailDrawerOpen(true);
    };

    const kpis = [
        {
            title: 'Total Objectives',
            value: overview?.total || 0,
            icon: <Target className="w-5 h-5 text-blue-400" />,
            color: "text-blue-400",
            bg: "bg-blue-400/5",
            border: "border-blue-400/10"
        },
        {
            title: 'On Track',
            value: overview?.onTrack || 0,
            icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
            color: "text-emerald-500",
            bg: "bg-emerald-400/5",
            border: "border-emerald-400/10"
        },
        {
            title: 'At Risk / Delayed',
            value: overview?.atRisk || 0,
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            color: "text-red-500",
            bg: "bg-red-400/5",
            border: "border-red-400/10"
        },
        {
            title: 'Achieved',
            value: overview?.achieved || 0,
            icon: <CheckCircle2 className="w-5 h-5 text-purple-400" />,
            color: "text-purple-400",
            bg: "bg-purple-400/5",
            border: "border-purple-400/10"
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ON_TRACK': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'AT_RISK': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'DELAYED': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'ACHIEVED': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'CANCELLED': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'BUSINESS': return 'text-blue-500';
            case 'SALES': return 'text-emerald-500';
            case 'MARKETING': return 'text-purple-500';
            case 'FINANCIAL': return 'text-amber-500';
            default: return 'text-zinc-500';
        }
    };

    const filteredGoals = goals?.filter(g => g.title.toLowerCase().includes(search.toLowerCase())) || [];
    const selectedGoal = goals?.find(g => g.id === useStrategyStore.getState().selectedGoalId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 pt-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Strategy & OKRs</h1>
                    <p className="text-sm text-[var(--text-disabled)] mt-1">Track company objectives and measure key results.</p>
                </div>
                <PermissionGuard module="crm" action="create">
                    <Button
                        onClick={() => setIsNewGoalModalOpen(true)}
                        className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[var(--primary)]/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Objective
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
                                    {kpi.value}
                                </h3>
                            </div>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", kpi.bg, kpi.border)}>
                                {kpi.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Toolbar & List */}
            <div className="px-6">
                <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/10 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
                            <Input
                                placeholder="Search objectives..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10 bg-[var(--card)] border-[var(--border)] rounded-xl font-medium focus:ring-[var(--primary)]"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[140px] h-10 bg-[var(--card)] border-[var(--border)] rounded-xl font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                    <SelectItem value="ALL" className="font-bold text-xs">All Types</SelectItem>
                                    {Object.values(StrategyType).map(t => (
                                        <SelectItem key={t} value={t} className="font-bold text-xs">{t.replace('_', ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-10 bg-[var(--card)] border-[var(--border)] rounded-xl font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                    <SelectItem value="ALL" className="font-bold text-xs">All Statuses</SelectItem>
                                    {Object.values(ObjectiveStatus).map(s => (
                                        <SelectItem key={s} value={s} className="font-bold text-xs">{s.replace('_', ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Goals List (Tree/Card hybrid) */}
                    <div className="divide-y divide-[var(--border)]/20">
                        {filteredGoals.length === 0 ? (
                            <div className="px-6 py-20 text-center">
                                <Target className="w-12 h-12 mx-auto text-[var(--muted)]/50 mb-3" />
                                <p className="text-sm font-bold text-[var(--text-disabled)]">No objectives found.</p>
                            </div>
                        ) : (
                            filteredGoals.map(goal => {
                                const progress = goal.targetValue && goal.targetValue > 0
                                    ? Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100))
                                    : 0;

                                return (
                                    <div
                                        key={goal.id}
                                        onClick={(e) => handleRowClick(goal.id, e)}
                                        className="p-6 group hover:bg-[var(--muted)]/20 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                                    >
                                        <div className="flex-1 flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)] flex items-center justify-center shrink-0">
                                                <Target className={cn("w-5 h-5", getTypeColor(goal.type))} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{goal.type}</span>
                                                    <span className={cn("px-2 py-0.5 text-[8px] font-black uppercase border rounded bg-[var(--card)]", getStatusColor(goal.status))}>
                                                        {goal.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors leading-tight">{goal.title}</h3>
                                                {goal.description && (
                                                    <p className="text-xs font-bold text-[var(--text-disabled)] mt-1 line-clamp-1">{goal.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                                            <div className="flex justify-between items-end text-xs">
                                                {goal.targetValue ? (
                                                    <>
                                                        <span className="font-bold text-[var(--text-secondary)]">{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                                                        <span className="font-black text-[var(--text-primary)]">{progress.toFixed(0)}%</span>
                                                    </>
                                                ) : (
                                                    <span className="font-bold text-[var(--text-disabled)] italic">No specific metric set</span>
                                                )}
                                            </div>
                                            {goal.targetValue && (
                                                <div className="h-2 w-full bg-[var(--muted)] rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all duration-1000", progress >= 100 ? "bg-emerald-500" : "bg-[var(--primary)]")}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </Card>
            </div>

            <NewGoalModal onGoalAdded={refreshData} />
            <GoalDetailDrawer goal={selectedGoal} onUpdated={refreshData} />
        </div>
    );
}
