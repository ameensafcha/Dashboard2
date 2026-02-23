'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
    TrendingUp,
    TrendingDown,
    Search,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    ChevronLeft,
    ChevronRight,
    BadgeDollarSign,
    Receipt
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Transaction {
    id: string;
    transactionId: string;
    type: 'revenue' | 'expense';
    amount: number;
    description: string;
    date: Date;
    referenceId: string | null;
}

interface TransactionsClientProps {
    initialData: {
        transactions: Transaction[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

export default function TransactionsClient({ initialData }: TransactionsClientProps) {
    const { t, isRTL } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'revenue' | 'expense'>('all');

    const filteredTransactions = initialData.transactions.filter(txn => {
        const matchesSearch = txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.transactionId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || txn.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                        {t.allTransactions || 'All Transactions'}
                    </h1>
                    <p className="text-sm text-[var(--text-disabled)] mt-1">
                        Comprehensive log of all revenue and expense activity.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 gap-2 h-11 px-5 text-xs font-bold uppercase tracking-widest">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-6 border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-sm border-b-4 border-b-[var(--primary)]/20">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
                        <Input
                            placeholder={t.search}
                            className="bg-[var(--muted)]/30 border-[var(--border)] rounded-xl pl-12 h-12 text-sm font-medium focus:ring-2 focus:ring-[var(--primary)]/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant={typeFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => setTypeFilter('all')}
                            className={cn(
                                "rounded-xl h-11 px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                                typeFilter === 'all' ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20" : "border-[var(--border)]"
                            )}
                        >
                            All
                        </Button>
                        <Button
                            variant={typeFilter === 'revenue' ? 'default' : 'outline'}
                            onClick={() => setTypeFilter('revenue')}
                            className={cn(
                                "rounded-xl h-11 px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                                typeFilter === 'revenue' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600" : "border-[var(--border)]"
                            )}
                        >
                            Revenue
                        </Button>
                        <Button
                            variant={typeFilter === 'expense' ? 'default' : 'outline'}
                            onClick={() => setTypeFilter('expense')}
                            className={cn(
                                "rounded-xl h-11 px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                                typeFilter === 'expense' ? "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600" : "border-[var(--border)]"
                            )}
                        >
                            Expenses
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]/30">
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.txn_description}</th>
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-left" : "text-right")}>{t.txn_amount}</th>
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.txn_id} / {t.txn_reference}</th>
                                <th className={cn("px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]", isRTL ? "text-right" : "text-left")}>{t.txn_date}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]/20">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <Receipt className="w-12 h-12 mb-4" />
                                            <p className="text-sm font-bold italic">{t.txn_noTransactions || 'No transactions found.'}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((txn) => (
                                    <tr key={txn.id} className="group hover:bg-[var(--muted)]/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300",
                                                    txn.type === 'revenue'
                                                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white"
                                                        : "bg-red-500/5 border-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white"
                                                )}>
                                                    {txn.type === 'revenue' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{txn.description}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md",
                                                            txn.type === 'revenue' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-400"
                                                        )}>
                                                            {txn.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6" style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                            <span className={cn(
                                                "text-base font-black tracking-tight",
                                                txn.type === 'revenue' ? "text-emerald-500" : "text-red-400"
                                            )}>
                                                {txn.type === 'revenue' ? '+' : '-'} SAR {txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-[var(--text-primary)] tracking-widest">{txn.transactionId}</p>
                                                {txn.referenceId && (
                                                    <p className="text-[10px] font-bold text-[var(--text-disabled)] uppercase">{txn.referenceId}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-center justify-center">
                                                <p className="text-[11px] font-black text-[var(--text-primary)] uppercase">
                                                    {new Date(txn.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] font-bold text-[var(--text-disabled)]">
                                                    {new Date(txn.date).getFullYear()}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-8 border-t border-[var(--border)]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-bold text-[var(--text-disabled)] uppercase tracking-widest">
                        Showing {filteredTransactions.length} of {initialData.pagination.total} records
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="w-10 h-10 p-0 rounded-xl border-[var(--border)] bg-[var(--card)] opacity-50 cursor-not-allowed">
                            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </Button>
                        <div className="flex items-center gap-1 mx-2">
                            {[...Array(Math.min(5, initialData.pagination.totalPages))].map((_, i) => (
                                <Button
                                    key={i}
                                    variant={i === 0 ? "default" : "outline"}
                                    className={cn(
                                        "w-10 h-10 p-0 rounded-xl text-xs font-black transition-all",
                                        i === 0 ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20" : "border-[var(--border)] bg-[var(--card)]"
                                    )}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>
                        <Button variant="outline" className="w-10 h-10 p-0 rounded-xl border-[var(--border)] bg-[var(--card)]">
                            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
