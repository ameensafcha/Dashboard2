'use client';

import { useEffect, useState } from 'react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Search, MoreHorizontal, Plus, Download } from 'lucide-react';
import { useSalesStore } from '@/stores/salesStore';
import { getOrders } from '@/app/actions/sales/orders';
import { OrderStatusBadge } from '@/components/sales/OrderStatusBadge';
import { OrderChannel, OrderStatus } from '@prisma/client';
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

export default function OrdersClient() {
    const { orders, setOrders, isLoading, setIsLoading, openOrderDrawer } = useSalesStore();
    const { t, isRTL } = useTranslation();

    const [searchQuery, setSearchQuery] = useState('');
    const [channelFilter, setChannelFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, [searchQuery, channelFilter, statusFilter]);

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <PageHeader title={isRTL ? 'الطلبات' : 'Orders'} />
                    <p className="text-[var(--text-secondary)] text-sm -mt-1 mb-2">
                        {isRTL ? 'إدارة الطلبات والمبيعات' : 'Manage your sales and view order history'}
                    </p>
                </div>
                <Link href="/sales/orders/new">
                    <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {isRTL ? 'طلب جديد' : 'New Order'}
                    </Button>
                </Link>
            </div>

            <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
                        <Input
                            placeholder={isRTL ? 'ابحث عن طلب...' : 'Search orders...'}
                            className="pl-9 bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-[150px]">
                            <Select value={channelFilter} onValueChange={setChannelFilter}>
                                <SelectTrigger className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]">
                                    <SelectValue placeholder="Channel" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    <SelectItem value="all">All Channels</SelectItem>
                                    <SelectItem value="b2b">B2B</SelectItem>
                                    <SelectItem value="b2c">B2C</SelectItem>
                                    <SelectItem value="pos">POS</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                    <SelectItem value="export">Export</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[150px]">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-[var(--border)] overflow-hidden">
                    <Table>
                        <TableHeader className="bg-[var(--background)]">
                            <TableRow className="border-b-[var(--border)] hover:bg-transparent">
                                <TableHead className="text-[var(--text-secondary)]">Order ID</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Date</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Client</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Channel</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Status</TableHead>
                                <TableHead className="text-[var(--text-secondary)] text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                                        Loading orders...
                                    </TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id} className="border-b-[var(--border)] hover:bg-[var(--background)]/50">
                                        <TableCell className="font-medium text-[var(--text-primary)]">
                                            {order.orderNumber}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-secondary)]">
                                            {new Date(order.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-[var(--text-primary)] font-medium">{order.client.name}</span>
                                                {order.company && (
                                                    <span className="text-xs text-[var(--text-muted)]">{order.company.name}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)]">
                                                {formatChannel(order.channel)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <OrderStatusBadge status={order.status} />
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-[var(--text-primary)]">
                                            {formatCurrency(order.grandTotal)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-[var(--text-secondary)]">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)]">
                                                    <DropdownMenuLabel className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => openOrderDrawer(order.id)}
                                                        className="cursor-pointer text-[var(--text-primary)] focus:bg-[var(--background)]"
                                                    >
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {order.invoice && (
                                                        <DropdownMenuItem
                                                            onClick={() => openOrderDrawer(order.id)}
                                                            className="cursor-pointer text-[var(--text-primary)] focus:bg-[var(--background)]"
                                                        >
                                                            <Download className="mr-2 h-4 w-4 text-[var(--text-muted)]" /> Download Invoice
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Slide-in Order Drawer */}
            <OrderDetailDrawer onInvoiceCreated={fetchOrders} />
        </div>
    );
}
