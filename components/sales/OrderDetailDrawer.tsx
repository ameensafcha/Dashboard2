'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Calendar,
    FileText,
    User,
    Building2,
    Truck,
    CreditCard,
    Download,
    ShoppingBag,
    Hash,
    Clock,
    CheckCircle2,
    Package,
    ArrowRight,
    Calculator,
    Globe
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
import { cn } from '@/lib/utils';

export default function OrderDetailDrawer({ onInvoiceCreated }: { onInvoiceCreated: () => void }) {
    const { isDrawerOpen, closeOrderDrawer, selectedOrderId, orders, updateOrderInStore } = useSalesStore();
    const { isRTL, language } = useTranslation();
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
            if (!order.invoice) {
                const result = await createInvoice({
                    orderId: order.id,
                    totalAmount: order.grandTotal,
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                });

                if (result.success) {
                    onInvoiceCreated();
                } else {
                    alert('Failed to save invoice record: ' + result.error);
                }
            }

            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.text('INVOICE', 14, 22);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Order: ${order.orderNumber}`, 14, 30);
            const invoiceNo = order.invoice?.invoiceNumber || `Pending`;
            doc.text(`Invoice: ${invoiceNo}`, 14, 35);
            doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 14, 40);
            doc.setTextColor(0);
            doc.setFontSize(12);
            doc.text('Billed To:', 14, 55);
            doc.setFontSize(10);
            doc.text(order.client.name, 14, 62);
            if (order.company) {
                doc.text(order.company.name, 14, 67);
            }
            const tableColumn = ["Product", "Qty", "Unit Price", "Discount", "Total"];
            const tableRows: any[] = [];
            order.orderItems.forEach(item => {
                const rowData = [
                    (item as any).productName || 'Product',
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
            const finalY = (doc as any).lastAutoTable.finalY || 80;
            doc.text(`Subtotal: ${formatCurrency(order.subTotal)}`, 140, finalY + 10);
            doc.text(`VAT: ${formatCurrency(order.vat)}`, 140, finalY + 16);
            doc.text(`Shipping: ${formatCurrency(order.shippingCost)}`, 140, finalY + 22);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Grand Total: ${formatCurrency(order.grandTotal)}`, 140, finalY + 32);
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
                className="w-full sm:max-w-2xl overflow-y-auto bg-[var(--background)] border-[var(--border)] p-0 scrollbar-hide"
            >
                {/* Header Area */}
                <div className="p-8 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-10 space-y-6">
                    <div className={cn("flex justify-between items-start gap-4", isRTL ? "flex-row-reverse" : "")}>
                        <div className="space-y-1">
                            <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-lg">
                                    <ShoppingBag className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <SheetTitle className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                                    {order.orderNumber}
                                </SheetTitle>
                            </div>
                            <div className={cn("flex items-center gap-2 mt-2", isRTL ? "flex-row-reverse" : "")}>
                                <OrderStatusBadge status={order.status} />
                                <span className="w-1 h-1 rounded-full bg-[var(--text-disabled)] opacity-30" />
                                <p className="text-[var(--text-disabled)] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(order.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Invoice Generation - Only for Processing and beyond */}
                        {order.status !== 'draft' && order.status !== 'cancelled' && (
                            <Button
                                onClick={handleGenerateInvoice}
                                disabled={isGenerating}
                                className="bg-[#E8A838] text-black hover:bg-[#d69628] h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-[#E8A838]/10 flex items-center gap-2 active:scale-95 transition-all"
                            >
                                <Download className="w-3.5 h-3.5" />
                                {isGenerating ? 'Generating...' : order.invoice ? 'Download Invoice' : 'Generate Invoice'}
                            </Button>
                        )}
                    </div>

                    {/* Order Pipeline Visual */}
                    {(() => {
                        const PIPELINE_STAGES = ['draft', 'confirmed', 'processing', 'shipped', 'delivered'];
                        const stageLabels: Record<string, string> = {
                            draft: 'Draft',
                            confirmed: 'Confirmed',
                            processing: 'Processing',
                            shipped: 'Shipped',
                            delivered: 'Delivered',
                        };
                        const stageIcons: Record<string, React.ReactNode> = {
                            draft: <FileText className="w-3.5 h-3.5" />,
                            confirmed: <CheckCircle2 className="w-3.5 h-3.5" />,
                            processing: <Clock className="w-3.5 h-3.5" />,
                            shipped: <Truck className="w-3.5 h-3.5" />,
                            delivered: <Package className="w-3.5 h-3.5" />,
                        };
                        const isCancelled = order.status === 'cancelled';
                        const currentIdx = PIPELINE_STAGES.indexOf(order.status);
                        const nextStatuses = getNextStatuses(order.status);

                        const handleStatusChange = async (newStatus: string) => {
                            setIsChangingStatus(true);
                            const result = await updateOrderStatus(order.id, newStatus as any);
                            setIsChangingStatus(false);
                            if (result.success) {
                                updateOrderInStore(order.id, { status: newStatus as any });
                            }
                        };

                        return (
                            <div className="space-y-4">
                                {/* Pipeline Steps */}
                                <div className={cn("flex items-center gap-0 w-full", isRTL ? "flex-row-reverse" : "")}>
                                    {PIPELINE_STAGES.map((stage, idx) => {
                                        const isCompleted = !isCancelled && currentIdx > idx;
                                        const isCurrent = !isCancelled && currentIdx === idx;
                                        const isUpcoming = !isCancelled && currentIdx < idx;

                                        return (
                                            <div key={stage} className="flex-1 flex items-center">
                                                <div className="flex flex-col items-center flex-1 relative">
                                                    {/* Step Circle */}
                                                    <div className={cn(
                                                        "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10",
                                                        isCompleted && "bg-emerald-500/20 border-emerald-500 text-emerald-400",
                                                        isCurrent && "bg-[#E8A838]/20 border-[#E8A838] text-[#E8A838] ring-4 ring-[#E8A838]/10",
                                                        isCancelled && "bg-red-500/20 border-red-500/40 text-red-400/50",
                                                        isUpcoming && "bg-[var(--muted)]/30 border-[var(--border)] text-[var(--text-disabled)]/40",
                                                    )}>
                                                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stageIcons[stage]}
                                                    </div>
                                                    {/* Label */}
                                                    <span className={cn(
                                                        "text-[8px] font-black uppercase tracking-widest mt-2 text-center leading-tight",
                                                        isCompleted && "text-emerald-400",
                                                        isCurrent && "text-[#E8A838]",
                                                        isCancelled && "text-red-400/40",
                                                        isUpcoming && "text-[var(--text-disabled)]/40",
                                                    )}>
                                                        {stageLabels[stage]}
                                                    </span>
                                                </div>
                                                {/* Connector Line */}
                                                {idx < PIPELINE_STAGES.length - 1 && (
                                                    <div className={cn(
                                                        "h-[2px] flex-shrink-0 w-full -mx-1 mt-[-18px]",
                                                        !isCancelled && currentIdx > idx ? "bg-emerald-500/40" : "bg-[var(--border)]/40",
                                                    )} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Cancelled Badge */}
                                {isCancelled && (
                                    <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Order Cancelled</span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {nextStatuses.length > 0 && (
                                    <div className={cn("flex gap-2", isRTL ? "flex-row-reverse" : "")}>
                                        {nextStatuses.filter(s => s !== 'cancelled').map(s => (
                                            <Button
                                                key={s}
                                                disabled={isChangingStatus}
                                                onClick={() => handleStatusChange(s)}
                                                className={cn(
                                                    "flex-1 h-10 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all active:scale-[0.97]",
                                                    s === 'confirmed' && "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20",
                                                    s === 'processing' && "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20",
                                                    s === 'shipped' && "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20",
                                                    s === 'delivered' && "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20",
                                                )}
                                            >
                                                {isChangingStatus ? (
                                                    <span className="animate-pulse">Updating...</span>
                                                ) : (
                                                    <>
                                                        <ArrowRight className={cn("w-3.5 h-3.5", isRTL ? "rotate-180" : "")} />
                                                        Move to {stageLabels[s]}
                                                    </>
                                                )}
                                            </Button>
                                        ))}
                                        {nextStatuses.includes('cancelled') && (
                                            <Button
                                                disabled={isChangingStatus}
                                                onClick={() => handleStatusChange('cancelled')}
                                                variant="outline"
                                                className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 transition-all active:scale-[0.97]"
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                <div className="p-8 space-y-10">
                    {/* Impact Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-5 bg-[var(--card)] border-[var(--border)] rounded-2xl flex flex-col gap-3 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-5 items-center justify-center flex">
                                <Calculator className="w-12 h-12 text-[var(--primary)]" />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-disabled)]", isRTL ? "text-right" : "")}>Gross Transaction</span>
                            <span className={cn("text-2xl font-black text-[var(--text-primary)] tracking-tighter", isRTL ? "text-right" : "")}>
                                {formatCurrency(order.grandTotal)}
                            </span>
                        </Card>
                        <Card className="p-5 bg-[var(--card)] border-[var(--border)] rounded-2xl flex flex-col gap-3 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-5 items-center justify-center flex">
                                <Globe className="w-12 h-12 text-[var(--primary)]" />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-disabled)]", isRTL ? "text-right" : "")}>Market Channel</span>
                            <div className={cn("flex pt-1", isRTL ? "justify-end" : "justify-start")}>
                                <Badge variant="outline" className="uppercase font-black text-[9px] tracking-[0.2em] bg-[var(--primary)]/10 text-[var(--primary)] border-0 px-3 py-1">
                                    {order.channel}
                                </Badge>
                            </div>
                        </Card>
                    </div>

                    {/* Logistics & Payment Summary */}
                    <div className="grid grid-cols-2 gap-6 pt-2">
                        <div className="space-y-4">
                            <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                <CreditCard className="w-4 h-4 text-[var(--primary)]/60" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Payment Phase</span>
                            </div>
                            <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                <div className="p-1 px-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] text-[11px] font-black text-[var(--text-primary)] capitalize">
                                    {order.paymentStatus.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                <Truck className="w-4 h-4 text-[var(--primary)]/60" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Fulfillment</span>
                            </div>
                            <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                <div className="p-1 px-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] text-[11px] font-black text-[var(--text-primary)] capitalize">
                                    {order.fulfillmentStatus.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Intelligence Card */}
                    <div className="space-y-4">
                        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Customer Intelligence</h3>
                        </div>
                        <Card className="bg-[var(--muted)]/20 border border-[var(--border)] rounded-2xl p-6 space-y-6">
                            <div className={cn("flex items-start gap-4", isRTL ? "flex-row-reverse" : "")}>
                                <div className="w-12 h-12 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center justify-center font-black text-[var(--primary)] text-lg shadow-sm">
                                    {order.client.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className={cn("space-y-1.5 flex-1", isRTL ? "text-right" : "")}>
                                    <p className="font-black text-[var(--text-primary)] tracking-tight">{order.client.name}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] opacity-80 flex items-center gap-1.5 justify-[var(--is-rtl-flex-start)]">
                                        <Hash className="w-3 h-3" />
                                        Primary Point of Contact
                                    </p>
                                </div>
                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-[var(--text-disabled)] hover:text-[var(--primary)] border border-transparent hover:border-[var(--primary)]/20 transition-all">
                                    <ArrowRight className={cn("w-4 h-4", isRTL ? "rotate-180" : "")} />
                                </Button>
                            </div>
                            {order.company && (
                                <div className={cn("flex items-start gap-4 pt-6 border-t border-[var(--border)]/50", isRTL ? "flex-row-reverse" : "")}>
                                    <div className="w-12 h-12 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--text-disabled)] shadow-sm">
                                        <Building2 className="w-6 h-6 opacity-40" />
                                    </div>
                                    <div className={cn("space-y-1.5 flex-1", isRTL ? "text-right" : "")}>
                                        <p className="font-black text-[var(--text-primary)] tracking-tight">{order.company.name}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] opacity-80 flex items-center gap-1.5">
                                            <Package className="w-3 h-3" />
                                            Corporate Entity / Account
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Fulfillment Line Items */}
                    <div className="space-y-4">
                        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Inventory Allocation ({order.orderItems.length})</h3>
                        </div>
                        <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--card)] shadow-sm">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-[var(--muted)]/40 text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] border-b border-[var(--border)]">
                                    <tr className={isRTL ? "text-right" : ""}>
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4 text-center">Unit</th>
                                        <th className={cn("px-6 py-4 text-right", isRTL ? "text-left" : "")}>Price</th>
                                        <th className={cn("px-6 py-4 text-right", isRTL ? "text-left" : "")}>Discount</th>
                                        <th className={cn("px-6 py-4 text-right", isRTL ? "text-left" : "")}>Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]/30 font-bold">
                                    {order.orderItems.map((item) => (
                                        <tr key={item.id} className="text-[var(--text-primary)] hover:bg-[var(--muted)]/20 transition-colors">
                                            <td className="px-6 py-4 font-bold text-sm">{(item as any).productName || item.productId.substring(0, 12) + '...'}</td>
                                            <td className="px-6 py-4 text-center">x {item.quantity}</td>
                                            <td className={cn("px-6 py-4 text-right whitespace-nowrap", isRTL ? "text-left" : "")}>{formatCurrency(item.unitPrice)}</td>
                                            <td className={cn("px-6 py-4 text-right text-emerald-500 font-black whitespace-nowrap", isRTL ? "text-left" : "")}>{item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}</td>
                                            <td className={cn("px-6 py-4 text-right font-black text-[var(--text-primary)] whitespace-nowrap", isRTL ? "text-left" : "")}>{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Final Reconciliation */}
                    <div className={cn("flex", isRTL ? "justify-start" : "justify-end")}>
                        <div className="w-full sm:w-2/3 bg-[var(--muted)]/20 p-8 rounded-2xl border border-[var(--border)] space-y-4">
                            <div className={cn("flex justify-between items-center", isRTL ? "flex-row-reverse" : "")}>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Subtotal</span>
                                <span className="text-sm font-bold text-[var(--text-secondary)]">{formatCurrency(order.subTotal)}</span>
                            </div>
                            <div className={cn("flex justify-between items-center", isRTL ? "flex-row-reverse" : "")}>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">VAT (15% Provision)</span>
                                <span className="text-sm font-bold text-[var(--text-secondary)]">{formatCurrency(order.vat)}</span>
                            </div>
                            <div className={cn("flex justify-between items-center pb-4 border-b border-[var(--border)]/50", isRTL ? "flex-row-reverse" : "")}>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Logistic Cost</span>
                                <span className="text-sm font-bold text-[var(--text-secondary)]">{formatCurrency(order.shippingCost)}</span>
                            </div>
                            <div className={cn("flex justify-between items-center pt-2", isRTL ? "flex-row-reverse" : "")}>
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)]">Grand Receivable</span>
                                <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">{formatCurrency(order.grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Operational Notes */}
                    {order.notes && (
                        <div className="space-y-4">
                            <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                <FileText className="w-4 h-4 text-[var(--primary)]" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Logistic Instructions</h3>
                            </div>
                            <div className={cn("bg-[#E8A838]/5 border border-[#E8A838]/20 rounded-2xl p-6 text-sm text-[var(--text-primary)] font-medium leading-relaxed italic", isRTL ? "text-right" : "")}>
                                "{order.notes}"
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

OrderDetailDrawer.displayName = 'OrderDetailDrawer';
