"use client"

import React from 'react'
import { Card } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
    Building2,
    Users,
    Handshake,
    DollarSign,
    ArrowRight,
    TrendingUp,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    Target
} from "lucide-react"
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface CrmOverviewData {
    kpis: { companies: number; contacts: number; activeDeals: number; pipelineValue: number };
    dealsByStage: { stage: string; count: number }[];
    recentDeals: { id: string; title: string; value: number; stage: string; updatedAt: string; company: { name: string } | null; client: { name: string } | null }[];
}

export default function CrmOverviewClient({ data }: { data: CrmOverviewData }) {
    const { t, isRTL } = useTranslation()

    const kpis = [
        {
            title: t.companies,
            value: data.kpis.companies,
            icon: <Building2 className="w-5 h-5 text-blue-400" />,
            color: "text-blue-400",
            bg: "bg-blue-400/5",
            border: "border-blue-400/10"
        },
        {
            title: t.contacts,
            value: data.kpis.contacts,
            icon: <Users className="w-5 h-5 text-emerald-400" />,
            color: "text-emerald-400",
            bg: "bg-emerald-400/5",
            border: "border-emerald-400/10"
        },
        {
            title: t.activeDeals,
            value: data.kpis.activeDeals,
            icon: <Handshake className="w-5 h-5 text-[var(--primary)]" />,
            color: "text-[var(--primary)]",
            bg: "bg-[var(--primary)]/5",
            border: "border-[var(--primary)]/10"
        },
        {
            title: t.pipelineValue,
            value: data.kpis.pipelineValue,
            prefix: 'SAR ',
            icon: <DollarSign className="w-5 h-5 text-amber-500" />,
            color: "text-amber-500",
            bg: "bg-amber-400/5",
            border: "border-amber-400/10"
        },
    ]

    const stageConfig: Record<string, { label: string; color: string }> = {
        new_lead: { label: (t as any).stage_new_lead, color: 'bg-zinc-500' },
        qualified: { label: (t as any).stage_qualified, color: 'bg-blue-500' },
        sample_sent: { label: (t as any).stage_sample_sent, color: 'bg-cyan-500' },
        proposal: { label: (t as any).stage_proposal, color: 'bg-[var(--primary)]' },
        negotiation: { label: (t as any).stage_negotiation, color: 'bg-purple-500' },
    }

    const totalDeals = data.dealsByStage.reduce((acc, s) => acc + s.count, 0)

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Simple Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                        {t.crmOverview}
                    </h1>
                    <p className="text-sm text-[var(--text-disabled)] mt-1">
                        Manage your customer relationships and track pipeline growth.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/crm/companies" className="h-10 px-4 flex items-center gap-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-all">
                        {t.companies}
                    </Link>
                    <Link href="/crm/contacts" className="h-10 px-4 flex items-center gap-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-all">
                        {t.contacts}
                    </Link>
                    <Link href="/crm/pipeline" className="h-10 px-5 flex items-center gap-2 rounded-xl text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-all">
                        {t.pipeline}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Clean KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, i) => (
                    <Card
                        key={i}
                        className="p-6 border-[var(--border)] bg-[var(--card)] rounded-2xl hover:border-[var(--primary)]/40 transition-all border-b-4 border-b-transparent hover:border-b-[var(--primary)] shadow-sm"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{kpi.title}</p>
                                <h3 className={cn("text-2xl font-black tracking-tight", kpi.color)}>
                                    {kpi.prefix}{typeof kpi.value === 'number' ? kpi.value.toLocaleString(undefined, { minimumFractionDigits: kpi.prefix ? 2 : 0, maximumFractionDigits: 2 }) : kpi.value}
                                </h3>
                            </div>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", kpi.bg, kpi.border)}>
                                {kpi.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Pipeline Distribution + Recent Deals */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Deals by Stage (Simplified) */}
                <Card className="lg:col-span-4 p-8 border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-sm h-fit">
                    <div className="mb-8">
                        <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">{t.dealsByStage}</h2>
                        <p className="text-[11px] text-[var(--text-disabled)] mt-0.5">Current pipeline health distribution.</p>
                    </div>

                    <div className="space-y-6">
                        {data.dealsByStage.length === 0 ? (
                            <p className="py-4 text-center text-xs font-bold text-[var(--text-disabled)] italic">{t.noActiveDeals}</p>
                        ) : (
                            data.dealsByStage.map(s => {
                                const config = stageConfig[s.stage] || { label: s.stage, color: 'bg-zinc-500' }
                                const percentage = totalDeals > 0 ? (s.count / totalDeals) * 100 : 0
                                return (
                                    <div key={s.stage} className="space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                            <span className="text-[var(--text-secondary)]">{config.label}</span>
                                            <span className="text-[var(--primary)]">{s.count}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-[var(--muted)]/50 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000", config.color.replace('zinc-500', 'zinc-400'))}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </Card>

                {/* Recent Deals Table (Focus & Clarity) */}
                <Card className="lg:col-span-8 border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-[var(--border)]/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">{t.pipeline}</h2>
                            <p className="text-[11px] text-[var(--text-disabled)] mt-0.5">Your most recent deal movements.</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-[var(--text-disabled)] opacity-20" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border)]/30">
                                    <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.txn_description}</th>
                                    <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-left" : "text-right")}>{t.txn_amount}</th>
                                    <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.status}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]/20">
                                {data.recentDeals.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center">
                                            <p className="text-sm font-bold text-[var(--text-disabled)] italic">{t.noDealsYet}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.recentDeals.slice(0, 10).map((d) => {
                                        const config = stageConfig[d.stage] || { label: d.stage, color: 'bg-zinc-500' }
                                        return (
                                            <tr key={d.id} className="group hover:bg-[var(--muted)]/30 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center border border-[var(--border)] group-hover:border-[var(--primary)]/30 transition-all font-black text-[10px] text-[var(--text-disabled)]">
                                                            <Target className="w-5 h-5 opacity-40" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{d.title}</p>
                                                            <p className="text-[10px] font-bold text-[var(--text-disabled)]">{d.company?.name || d.client?.name || 'Individual'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6" style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                                    <span className="text-sm font-black tracking-tight text-[var(--text-primary)]">
                                                        SAR {d.value.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight text-center inline-block min-w-[100px]",
                                                        config.color.replace('bg-', 'text-'),
                                                        config.color.replace('bg-', 'bg-') + "/10",
                                                        "border border-current"
                                                    )}>
                                                        {config.label}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-[var(--muted)]/10 border-t border-[var(--border)]/30 text-center">
                        <Link href="/crm/pipeline" className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline">
                            {t.viewPipeline}
                            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    )
}
