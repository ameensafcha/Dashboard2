"use client"

import React from 'react'
import { Card } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    BadgeDollarSign,
    ArrowUpRight,
    ArrowDownLeft,
    ChevronLeft,
    ChevronRight,
    ArrowRight
} from "lucide-react"
import Link from 'next/link'

interface FinanceClientProps {
    summary: {
        totalRevenue: number
        totalExpenses: number
        netProfit: number
        profitMargin: number
        revenueCount: number
        expenseCount: number
        recentTransactions: any[]
    }
}

export function FinanceClient({ summary }: FinanceClientProps) {
    const { t, isRTL } = useTranslation()

    const kpis = [
        {
            label: t.totalRevenue,
            value: summary.totalRevenue,
            icon: <TrendingUp className="w-5 h-5 text-[var(--primary)]" />,
            color: "text-[var(--primary)]",
            bg: "bg-[var(--primary)]/5",
            border: "border-[var(--primary)]/10"
        },
        {
            label: t.totalExpensesSummary,
            value: summary.totalExpenses,
            icon: <TrendingDown className="w-5 h-5 text-red-500" />,
            color: "text-red-500",
            bg: "bg-red-500/5",
            border: "border-red-500/10"
        },
        {
            label: t.netProfit,
            value: summary.netProfit,
            icon: <Wallet className="w-5 h-5 text-emerald-500" />,
            color: summary.netProfit >= 0 ? "text-emerald-400" : "text-red-500",
            bg: "bg-emerald-400/5",
            border: "border-emerald-400/10"
        },
        {
            label: t.profitMargin,
            value: summary.profitMargin,
            icon: <BadgeDollarSign className="w-5 h-5 text-amber-500" />,
            color: "text-amber-500",
            bg: "bg-amber-400/5",
            border: "border-amber-400/10",
            isPercent: true
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Consolidated Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                        {t.financeOverview}
                    </h1>
                    <p className="text-sm text-[var(--text-disabled)] mt-1">
                        Control center for your revenue and operational expenditure.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-3 px-4 h-10 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)]">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] whitespace-nowrap">All Systems Nominal</span>
                    </div>
                    <Link
                        href="/finance/expenses"
                        className="h-10 px-6 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 shadow-lg transition-all active:scale-95"
                    >
                        {t.manageExpenses || 'Manage Expenses'}
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
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{kpi.label}</p>
                                <h3 className={cn("text-2xl font-black tracking-tight", kpi.color)}>
                                    {!kpi.isPercent && "SAR "}{kpi.value.toLocaleString()}{kpi.isPercent && "%"}
                                </h3>
                            </div>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", kpi.bg, kpi.border)}>
                                {kpi.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-[var(--border)] bg-[var(--card)] rounded-2xl flex items-center justify-between border-l-4 border-l-emerald-500 shadow-sm">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">{t.revenueTransactions}</p>
                        <h4 className="text-2xl font-black text-[var(--text-primary)] mt-1">{summary.revenueCount}</h4>
                        <p className="text-[11px] font-bold text-[var(--text-disabled)] mt-1">{t.txn_autoRevenueMsg}</p>
                    </div>
                </Card>

                <Card className="p-6 border-[var(--border)] bg-[var(--card)] rounded-2xl flex items-center justify-between border-l-4 border-l-red-500 shadow-sm">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500/70">{t.expenseRecords}</p>
                        <h4 className="text-2xl font-black text-[var(--text-primary)] mt-1">{summary.expenseCount}</h4>
                        <Link href="/finance/expenses" className="text-[11px] font-black text-[var(--primary)] hover:underline mt-2 inline-block">
                            {t.viewAllExpenses} →
                        </Link>
                    </div>
                </Card>
            </div>

            {/* Recent Transactions Table */}
            <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-8 border-b border-[var(--border)]/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">{t.recentTransactions}</h2>
                        <p className="text-[11px] text-[var(--text-disabled)] mt-0.5">Your latest financial activity.</p>
                    </div>
                    <BadgeDollarSign className="w-6 h-6 text-[var(--text-disabled)] opacity-20" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]/30">
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.txn_description}</th>
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-left" : "text-right")}>{t.txn_amount}</th>
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.txn_date}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]/20">
                            {summary.recentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center">
                                        <p className="text-sm font-bold text-[var(--text-disabled)] italic">{t.txn_noTransactions}</p>
                                    </td>
                                </tr>
                            ) : (
                                summary.recentTransactions.slice(0, 10).map((txn) => (
                                    <tr key={txn.id} className="group hover:bg-[var(--muted)]/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center border",
                                                    txn.type === 'revenue' ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500" : "bg-red-500/5 border-red-500/10 text-red-400"
                                                )}>
                                                    {txn.type === 'revenue' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[var(--text-primary)]">{txn.description}</p>
                                                    <p className="text-[10px] text-[var(--text-disabled)] font-bold">{txn.transactionId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6" style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                            <span className={cn("text-sm font-black tracking-tight", txn.type === 'revenue' ? "text-emerald-500" : "text-red-400")}>
                                                {txn.type === 'revenue' ? '+' : '-'} SAR {txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] font-black text-[var(--text-disabled)] uppercase text-center">
                                                {new Date(txn.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-[var(--muted)]/10 border-t border-[var(--border)]/30 text-center">
                    <Link href="/finance/expenses" className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline">
                        {t.viewFullHistory}
                        {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </Link>
                </div>
            </Card>
        </div>
    )
}
