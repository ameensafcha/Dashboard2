'use client';

import { useEffect, useState, Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, MoreHorizontal, Plus, Download, Calendar, Hash, ShoppingCart, User, Building2, ArrowRight } from 'lucide-react';
import { useSalesStore } from '@/stores/salesStore';
import { getOrders } from '@/app/actions/sales/orders';
import { OrderStatusBadge } from '@/components/sales/OrderStatusBadge';
import { useTranslation } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OrderDetailDrawer from '@/components/sales/OrderDetailDrawer';
import { cn } from '@/lib/utils';

function OrdersClientContent() {
    const { orders, setOrders, isLoading, setIsLoading, openOrderDrawer } = useSalesStore();
    const { t, isRTL, language } = useTranslation();

    const [searchQuery, setSearchQuery] = useState('');
    const [channelFilter, setChannelFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchOrders = async () => {
        setIsLoading(true);
        const result = await getOrders(
            searchQuery || undefined,
            channelFilter as any,
            statusFilter as any
        );
        if (result.success && result.orders) {
            setOrders(result.orders);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, [searchQuery, channelFilter, statusFilter]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: 'SAR'
        }).format(amount);
    };

    const formatChannel = (channel: string) => {
        switch (channel) {
            case 'b2b': return 'B2B';
            case 'b2c': return 'B2C';
            case 'pos': return 'POS';
            case 'event': return 'Event';
            case 'export': return 'Export';
            default: return 'Other';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
            <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6", isRTL ? "sm:flex-row-reverse" : "")}>
                <div>
                    <PageHeader title={isRTL ? 'الطلبات' : 'Sales Orders'} />
                    <p className={cn("text-[var(--text-secondary)] text-sm font-bold uppercase tracking-wider mt-1", isRTL ? "text-right" : "")}>
                        {isRTL ? 'إدارة المبيعات وسجل الطلبات' : 'Monitor sales performance and order lifecycle'}
                    </p>
                </div>
                <Link href="/sales/orders/new">
                    <Button className="bg-[#E8A838] text-black hover:bg-[#d69628] px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-[#E8A838]/20 active:scale-95 flex items-center gap-3 group">
                        <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                        {isRTL ? 'طلب جديد' : 'Draft New Order'}
                    </Button>
                </Link>
            </div>

            {/* Premium Table Container */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden relative transition-all">
                {/* Search & Filter Bar */}
                <div className={cn("p-6 border-b border-[var(--border)] bg-[var(--muted)]/20 flex flex-col lg:flex-row gap-4 justify-between", isRTL ? "lg:flex-row-reverse" : "")}>
                    <div className={cn("flex flex-col sm:flex-row gap-3 w-full flex-1", isRTL ? "sm:flex-row-reverse" : "")}>
                        <form onSubmit={(e) => { e.preventDefault(); fetchOrders(); }} className="relative w-full sm:max-w-md group">
                            <Search className={cn("absolute top-3.5 h-4 w-4 text-[var(--text-disabled)] transition-colors group-focus-within:text-[var(--primary)]", isRTL ? "right-4" : "left-4")} />
                            <Input
                                placeholder={isRTL ? 'ابحث عن رقم الطلب أو العميل...' : 'Search order #, client, or items...'}
                                className={cn(
                                    "bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium",
                                    isRTL ? "pr-12 text-right" : "pl-12"
                                )}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoComplete="off"
                            />
                        </form>

                        <div className={cn("flex gap-3", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-[160px]">
                                <Select value={channelFilter} onValueChange={setChannelFilter}>
                                    <SelectTrigger className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl focus:ring-1 focus:ring-[var(--primary)] font-bold uppercase tracking-tight text-[10px]">
                                        <SelectValue placeholder="Channel" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                        <SelectItem value="all" className="text-xs font-bold uppercase">All Channels</SelectItem>
                                        <SelectItem value="b2b" className="text-xs font-bold">B2B (Wholesale)</SelectItem>
                                        <SelectItem value="b2c" className="text-xs font-bold">B2C (Retail)</SelectItem>
                                        <SelectItem value="pos" className="text-xs font-bold">POS</SelectItem>
                                        <SelectItem value="event" className="text-xs font-bold">Event</SelectItem>
                                        <SelectItem value="export" className="text-xs font-bold">Export</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-[160px]">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)] h-11 rounded-xl focus:ring-1 focus:ring-[var(--primary)] font-bold uppercase tracking-tight text-[10px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                        <SelectItem value="all" className="text-xs font-bold uppercase">All Statuses</SelectItem>
                                        <SelectItem value="draft" className="text-xs font-bold capitalize">Draft</SelectItem>
                                        <SelectItem value="confirmed" className="text-xs font-bold capitalize">Confirmed</SelectItem>
                                        <SelectItem value="processing" className="text-xs font-bold capitalize">Processing</SelectItem>
                                        <SelectItem value="shipped" className="text-xs font-bold capitalize">Shipped</SelectItem>
                                        <SelectItem value="delivered" className="text-xs font-bold capitalize">Delivered</SelectItem>
                                        <SelectItem value="cancelled" className="text-xs font-bold capitalize">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-[0.2em] bg-[var(--muted)]/50 border-b border-[var(--border)]">
                            <tr className={isRTL ? "text-right" : ""}>
                                <th className="px-8 py-5 flex items-center gap-2">
                                    <Hash className="w-3 h-3 opacity-50" />
                                    {isRTL ? 'رقم الطلب' : 'Order Reference'}
                                </th>
                                <th className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3 opacity-50" />
                                        {isRTL ? 'العميل' : 'Account / Client'}
                                    </div>
                                </th>
                                <th className="px-8 py-5">{isRTL ? 'القناة' : 'Sales Channel'}</th>
                                <th className="px-8 py-5">{isRTL ? 'الحالة' : 'Fulfillment Status'}</th>
                                <th className={cn("px-8 py-5 text-right", isRTL ? "text-left" : "")}>{isRTL ? 'المجموع' : 'Grand Total'}</th>
                                <th className="w-[80px] px-8 py-5 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <div className="w-10 h-10 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Compiling sales data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-16 h-16 rounded-2xl bg-[var(--muted)]/30 flex items-center justify-center border border-dashed border-[var(--border)]">
                                                <ShoppingCart className="h-8 w-8 text-[var(--text-disabled)] opacity-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-[var(--text-primary)]">No orders found</p>
                                                <p className="text-xs text-[var(--text-muted)]">Your sales queue is currently empty.</p>
                                            </div>
                                            <Link href="/sales/orders/new">
                                                <Button
                                                    variant="outline"
                                                    className="border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/5 font-black uppercase tracking-tighter text-[10px] mt-4"
                                                >
                                                    Draft First Order
                                                </Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className={cn(
                                            "hover:bg-[var(--muted)]/40 cursor-pointer transition-all group border-b border-[var(--border)]/30 last:border-0",
                                            isRTL ? "text-right" : ""
                                        )}
                                        onClick={() => openOrderDrawer(order.id)}
                                    >
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <div className="text-[14px] font-black text-[var(--text-primary)] group-hover:text-[#E8A838] transition-colors tracking-tight">
                                                    {order.orderNumber}
                                                </div>
                                                <div className={cn("flex items-center gap-1.5 text-[10px] text-[var(--text-disabled)] font-bold uppercase tracking-tighter", isRTL ? "flex-row-reverse" : "")}>
                                                    <Calendar className="w-3 h-3 opacity-50" />
                                                    {new Date(order.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-left">
                                            <div className={cn("flex flex-col gap-1", isRTL ? "items-end" : "items-start")}>
                                                <div className={cn("flex items-center gap-2 font-black text-xs text-[var(--text-primary)]", isRTL ? "flex-row-reverse" : "")}>
                                                    {order.client.name}
                                                </div>
                                                {order.company && (
                                                    <div className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]", isRTL ? "flex-row-reverse" : "")}>
                                                        <Building2 className="w-3 h-3 opacity-40" />
                                                        {order.company.name}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest border-0 bg-[var(--background)] py-1 px-3 text-[var(--text-secondary)]">
                                                {formatChannel(order.channel)}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-5">
                                            <OrderStatusBadge status={order.status} />
                                        </td>
                                        <td className={cn("px-8 py-5 font-black text-[14px] tracking-tight text-[var(--text-primary)]", isRTL ? "text-left" : "text-right")}>
                                            {formatCurrency(order.grandTotal)}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className={cn("flex items-center gap-1 justify-center", isRTL ? "flex-row-reverse" : "")}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-[var(--text-disabled)] hover:text-[#E8A838] hover:bg-[#E8A838]/10 transition-all">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align={isRTL ? "start" : "end"} className="bg-[var(--card)] border-[var(--border)] shadow-2xl p-2 rounded-xl min-w-[160px] z-[100]">
                                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-3 py-2">Quick Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={(e) => { e.stopPropagation(); openOrderDrawer(order.id); }}
                                                            className="rounded-lg text-xs font-bold py-2.5 px-3 focus:bg-[var(--primary)]/10 focus:text-[var(--primary)] cursor-pointer"
                                                        >
                                                            View Full Details
                                                        </DropdownMenuItem>
                                                        {order.invoice && (
                                                            <DropdownMenuItem
                                                                onClick={(e) => { e.stopPropagation(); openOrderDrawer(order.id); }}
                                                                className="rounded-lg text-xs font-bold py-2.5 px-3 focus:bg-[var(--primary)]/10 focus:text-[var(--primary)] cursor-pointer"
                                                            >
                                                                <Download className="mr-2 h-4 w-4 opacity-50 transition-colors" /> Save Invoice PDF
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ml-1">
                                                    <ArrowRight className={cn("w-4 h-4 text-[var(--primary)]", isRTL ? "rotate-180" : "")} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <OrderDetailDrawer onInvoiceCreated={fetchOrders} />
        </div>
    );
}

export default function OrdersClient() {
    return (
        <Suspense fallback={
            <div className="p-4 sm:p-6 lg:p-10 flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-4 opacity-40">
                    <div className="w-10 h-10 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">Synchronizing orders...</p>
                </div>
            </div>
        }>
            <OrdersClientContent />
        </Suspense>
    );
}
