'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    FileText,
    User,
    Building2,
    Truck,
    CreditCard,
    Download
} from 'lucide-react';
import { useSalesStore } from '@/stores/salesStore';
import { OrderStatusBadge } from './OrderStatusBadge';
import { useTranslation } from '@/lib/i18n';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createInvoice } from '@/app/actions/sales/invoices';
import { updateOrderStatus } from '@/app/actions/sales/update-order-status';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function OrderDetailDrawer({ onInvoiceCreated }: { onInvoiceCreated: () => void }) {
    const { isDrawerOpen, closeOrderDrawer, selectedOrderId, orders, updateOrderInStore } = useSalesStore();
    const { isRTL } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);

    // Client-side valid transitions
    const VALID_TRANSITIONS: Record<string, string[]> = {
        draft: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: [],
        cancelled: [],
    };
    const getNextStatuses = (status: string) => VALID_TRANSITIONS[status] || [];

    const order = orders.find(o => o.id === selectedOrderId);

    if (!order) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: 'SAR'
        }).format(amount);
    };

    const handleGenerateInvoice = async () => {
        setIsGenerating(true);
        try {
            // 1. Create Invoice Record in DB if it doesn't exist
            if (!order.invoice) {
                const result = await createInvoice({
                    orderId: order.id,
                    totalAmount: order.grandTotal,
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Net 30 default
                });

                if (result.success) {
                    onInvoiceCreated(); // Trigger a refresh of the parent data
                } else {
                    alert('Failed to save invoice record: ' + result.error);
                }
            }

            // 2. Build PDF Document
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.text('INVOICE', 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Order: ${order.orderNumber}`, 14, 30);
            const invoiceNo = order.invoice?.invoiceNumber || `Pending`;
            doc.text(`Invoice: ${invoiceNo}`, 14, 35);
            doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 14, 40);

            // Billed To
            doc.setTextColor(0);
            doc.setFontSize(12);
            doc.text('Billed To:', 14, 55);
            doc.setFontSize(10);
            doc.text(order.client.name, 14, 62);
            if (order.company) {
                doc.text(order.company.name, 14, 67);
            }

            // Line Items Table
            const tableColumn = ["Item ID", "Qty", "Unit Price", "Discount", "Total"];
            const tableRows: any[] = [];

            order.orderItems.forEach(item => {
                const rowData = [
                    item.productId.substring(0, 8) + '...', // Ideally map this to Product Name if we had it populated
                    item.quantity.toString(),
                    formatCurrency(item.unitPrice),
                    formatCurrency(item.discount),
                    formatCurrency(item.total)
                ];
                tableRows.push(rowData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 80,
            });

            // Financial Summary
            const finalY = (doc as any).lastAutoTable.finalY || 80;
            doc.text(`Subtotal: ${formatCurrency(order.subTotal)}`, 140, finalY + 10);
            doc.text(`VAT: ${formatCurrency(order.vat)}`, 140, finalY + 16);
            doc.text(`Shipping: ${formatCurrency(order.shippingCost)}`, 140, finalY + 22);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Grand Total: ${formatCurrency(order.grandTotal)}`, 140, finalY + 32);

            // Save
            doc.save(`Invoice_${order.orderNumber}.pdf`);

        } catch (error) {
            console.error(error);
            alert('Failed to generate invoice pdf');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeOrderDrawer()}>
            <SheetContent
                side={isRTL ? "left" : "right"}
                className="w-full sm:max-w-2xl overflow-y-auto bg-[var(--background)] border-[var(--border)] p-0"
            >
                {/* Header Area */}
                <div className="p-6 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-10 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <SheetTitle className="text-2xl font-bold text-[var(--text-primary)]">
                                {order.orderNumber}
                            </SheetTitle>
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.date).toLocaleDateString()}
                        </p>
                        {/* Status Change Dropdown */}
                        {getNextStatuses(order.status).length > 0 && (
                            <div className="mt-3">
                                <Select
                                    disabled={isChangingStatus}
                                    onValueChange={async (newStatus) => {
                                        setIsChangingStatus(true);
                                        const result = await updateOrderStatus(order.id, newStatus as any);
                                        setIsChangingStatus(false);
                                        if (result.success) {
                                            updateOrderInStore(order.id, { status: newStatus as any });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-[200px] bg-[var(--background)] border-[var(--border)] text-sm">
                                        <SelectValue placeholder={isChangingStatus ? 'Updating...' : 'Change Status →'} />
                                    </SelectTrigger>
                                    <SelectContent className="z-[200]">
                                        {getNextStatuses(order.status).map(s => (
                                            <SelectItem key={s} value={s} className="capitalize">
                                                {s.replace('_', ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleGenerateInvoice}
                        disabled={isGenerating}
                        className="bg-[var(--primary)] text-white"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isGenerating ? 'Generating...' : order.invoice ? 'Download Invoice' : 'Generate Invoice'}
                    </Button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Quick Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] flex flex-col items-center justify-center text-center">
                            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">Total Amount</p>
                            <p className="text-lg font-bold text-[var(--text-primary)] whitespace-nowrap">{formatCurrency(order.grandTotal)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] flex flex-col items-center justify-center text-center">
                            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">Channel</p>
                            <Badge variant="outline" className="uppercase bg-[var(--background)]">{order.channel}</Badge>
                        </div>
                        <div className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] flex flex-col items-center justify-center text-center">
                            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">Payment</p>
                            <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                                <CreditCard className="w-4 h-4 text-[var(--text-secondary)]" />
                                <span className="capitalize">{order.paymentStatus.replace('_', ' ')}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] flex flex-col items-center justify-center text-center">
                            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">Fulfillment</p>
                            <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                                <Truck className="w-4 h-4 text-[var(--text-secondary)]" />
                                <span className="capitalize">{order.fulfillmentStatus.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wider">Customer Information</h3>
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-[var(--text-muted)] mt-0.5" />
                                <div>
                                    <p className="font-medium text-[var(--text-primary)]">{order.client.name}</p>
                                    <p className="text-sm text-[var(--text-secondary)]">Primary Contact</p>
                                </div>
                            </div>
                            {order.company && (
                                <div className="flex items-start gap-3 pt-4 border-t border-[var(--border)]">
                                    <Building2 className="w-5 h-5 text-[var(--text-muted)] mt-0.5" />
                                    <div>
                                        <p className="font-medium text-[var(--text-primary)]">{order.company.name}</p>
                                        <p className="text-sm text-[var(--text-secondary)]">Company / Account</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wider">Line Items ({order.orderItems.length})</h3>
                        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left align-middle">
                                <thead className="bg-[var(--card)] text-[var(--text-secondary)] border-b border-[var(--border)]">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold w-1/3">Product ID</th>
                                        <th className="px-4 py-3 font-semibold text-center w-16">Qty</th>
                                        <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                                        <th className="px-4 py-3 font-semibold text-right">Discount</th>
                                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                                    {order.orderItems.map((item) => (
                                        <tr key={item.id} className="text-[var(--text-primary)] hover:bg-[var(--background)]/80">
                                            <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{item.productId.substring(0, 8)}...</td>
                                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-4 py-3 text-right text-red-500 font-medium whitespace-nowrap" dir="ltr">{item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                                            <td className="px-4 py-3 text-right font-bold text-[var(--text-primary)] whitespace-nowrap">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex justify-end">
                        <div className="w-full sm:w-1/2 space-y-3 bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
                            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.subTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                <span>VAT (15%)</span>
                                <span>{formatCurrency(order.vat)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-[var(--text-secondary)] pb-3 border-b border-[var(--border)]">
                                <span>Shipping</span>
                                <span>{formatCurrency(order.shippingCost)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-[var(--text-primary)] pt-1">
                                <span>Grand Total</span>
                                <span>{formatCurrency(order.grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Notes
                            </h3>
                            <div className="bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4 text-sm text-[var(--text-primary)]">
                                {order.notes}
                            </div>
                        </div>
                    )}

                </div>
            </SheetContent>
        </Sheet>
    );
}
