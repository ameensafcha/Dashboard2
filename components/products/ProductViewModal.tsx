'use client';

import Image from 'next/image';
import { useAppStore } from '@/stores/appStore';
import { productStatuses, sfdaStatuses } from '@/app/actions/product/types';
import { Edit, Package, Trash2, Calendar, Coffee, FileCheck, DollarSign, Scale, Hash, LayoutGrid, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductsResponse } from '@/app/actions/product/actions';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

type ProductType = ProductsResponse['products'][0];

interface ProductViewModalProps {
    product: ProductType | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (product: ProductType, e: React.MouseEvent) => void;
    onDelete: (productId: string, e: React.MouseEvent) => void;
}

const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600 border border-green-500/20',
    in_development: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
    discontinued: 'bg-red-500/10 text-red-600 border border-red-500/20',
};

export default function ProductViewModal({
    product,
    isOpen,
    onClose,
    onEdit,
    onDelete,
}: ProductViewModalProps) {
    const { isRTL } = useAppStore();
    const { t } = useTranslation();

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-[var(--border)] shadow-xl rounded-2xl bg-[var(--background)]">
                <DialogHeader className="px-8 py-6 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-10">
                    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRTL ? "sm:flex-row-reverse" : "")}>
                        <div className={cn("space-y-1.5", isRTL ? "text-right" : "")}>
                            <DialogTitle className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                                {product.name}
                                <Badge className={cn(
                                    "px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                    statusColors[product.status] || 'bg-gray-500'
                                )}>
                                    {productStatuses.find(s => s.value === product.status)?.label}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className={cn("text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                <Hash className="w-3.5 h-3.5 text-[var(--primary)]" /> {product.skuPrefix}
                            </DialogDescription>
                        </div>

                        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                            <Button
                                size="sm"
                                onClick={(e) => onEdit(product, e)}
                                className="bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] font-bold uppercase tracking-widest text-[10px] h-9 px-5 rounded-lg transition-all shadow-sm"
                            >
                                <Edit className="w-3.5 h-3.5 mr-2" />
                                <span>{isRTL ? 'تعديل' : 'Edit'}</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => onDelete(product.id, e)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/5 font-bold uppercase tracking-widest text-[10px] h-9 px-5 rounded-lg transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                <span>{isRTL ? 'حذف' : 'Delete'}</span>
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className={cn("overflow-y-auto p-8 sm:p-10 flex flex-col lg:flex-row gap-10 lg:gap-12", isRTL ? "lg:flex-row-reverse" : "")}>
                    {/* Left Column - Image & Pricing */}
                    <div className="w-full lg:w-80 shrink-0 space-y-8">
                        <div className="aspect-square relative rounded-xl overflow-hidden bg-[var(--muted)] border border-[var(--border)] shadow-sm flex items-center justify-center">
                            {product.image ? (
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-[var(--text-muted)]">
                                    <Package className="w-12 h-12 opacity-20 mb-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">No image</span>
                                </div>
                            )}
                        </div>

                        {/* Pricing Card */}
                        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-6">
                            <h4 className={cn("text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                <DollarSign className="w-3.5 h-3.5 text-[var(--primary)]" />
                                {isRTL ? 'التسعير' : 'Pricing'}
                            </h4>

                            <div className="space-y-4">
                                <div className={cn("flex justify-between items-center group", isRTL ? "flex-row-reverse" : "")}>
                                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{isRTL ? 'التكلفة' : 'Cost'}</span>
                                    <span className="text-sm font-bold text-[var(--text-primary)]">SAR {Number(product.baseCost).toFixed(2)}</span>
                                </div>
                                <div className={cn("flex justify-between items-center pt-2 border-t border-[var(--border)]", isRTL ? "flex-row-reverse" : "")}>
                                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{isRTL ? 'السعر' : 'Price'}</span>
                                    <span className="text-xl font-bold text-[var(--primary)]">SAR {Number(product.baseRetailPrice).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="flex-1 space-y-10">
                        {/* Core Details Segment */}
                        <div className="space-y-6">
                            <h3 className={cn("text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                <LayoutGrid className="w-4 h-4 text-[var(--primary)]" />
                                {isRTL ? 'المعلومات الأساسية' : 'Core Information'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10 border border-[var(--border)] rounded-xl p-8 bg-[var(--card)] shadow-sm">
                                <DetailBox icon={Tag} label={isRTL ? 'الفئة' : 'Category'} value={product.category?.name || 'Uncategorized'} />
                                <DetailBox icon={Scale} label={isRTL ? 'الحجم' : 'Size'} value={product.size ? `${Number(product.size)} ${product.unit || ''}` : 'N/A'} />

                                <div className={cn("space-y-2", isRTL ? "text-right" : "")}>
                                    <p className={cn("text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                        <Coffee className="w-3.5 h-3.5 text-[var(--primary)]" /> {isRTL ? 'الكافيين' : 'Caffeine'}
                                    </p>
                                    <Badge variant="outline" className={cn(
                                        "px-3 py-1 font-bold",
                                        product.caffeineFree ? "text-green-600 bg-green-500/5 border-green-500/10" : "text-[var(--text-primary)]"
                                    )}>
                                        {product.caffeineFree ? (isRTL ? 'خالي' : 'Caffeine-free') : (isRTL ? 'يحتوي' : 'Standard')}
                                    </Badge>
                                </div>

                                <DetailBox icon={Calendar} label={isRTL ? 'تاريخ الإطلاق' : 'Launch Date'} value={product.launchDate ? new Date(product.launchDate).toLocaleDateString() : 'TBD'} />
                            </div>
                        </div>

                        {/* Regulatory Breakdown */}
                        <div className="space-y-6">
                            <h3 className={cn("text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                <FileCheck className="w-4 h-4 text-green-600" />
                                {isRTL ? 'المعلومات التنظيمية' : 'Compliance & Regulatory'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10 border border-[var(--border)] rounded-xl p-8 bg-[var(--card)] shadow-sm">
                                <div className={cn("space-y-2", isRTL ? "text-right" : "")}>
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{isRTL ? 'الحالة FDA' : 'SFDA Status'}</p>
                                    <Badge className={cn(
                                        "px-4 py-1.5 font-bold uppercase tracking-wider text-[10px]",
                                        product.sfdaStatus === 'approved' ? 'bg-green-600 text-white' : product.sfdaStatus === 'pending' ? 'bg-yellow-500 text-black' : 'bg-[var(--muted)] text-[var(--text-secondary)]'
                                    )}>
                                        {sfdaStatuses.find(s => s.value === product.sfdaStatus)?.label}
                                    </Badge>
                                </div>
                                <DetailBox icon={Hash} label={isRTL ? 'المرجع FDA' : 'SFDA Reference'} value={product.sfdaReference || 'N/A'} />
                            </div>
                        </div>

                        {/* Description */}
                        {(product.keyIngredients || product.description) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {product.keyIngredients && (
                                    <div className="space-y-3">
                                        <p className={cn("text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider", isRTL ? "text-right" : "")}>{isRTL ? 'المكونات' : 'Key Ingredients'}</p>
                                        <div className="bg-[var(--muted)]/50 p-5 rounded-xl text-sm border border-[var(--border)] text-[var(--text-primary)] leading-relaxed italic">
                                            &quot;{product.keyIngredients}&quot;
                                        </div>
                                    </div>
                                )}
                                {product.description && (
                                    <div className="space-y-3">
                                        <p className={cn("text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider", isRTL ? "text-right" : "")}>{isRTL ? 'الوصف' : 'Description'}</p>
                                        <div className="bg-[var(--muted)]/50 p-5 rounded-xl text-sm border border-[var(--border)] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                            {product.description}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DetailBox({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    const { isRTL } = useAppStore();
    return (
        <div className={cn("space-y-1.5", isRTL ? "text-right" : "")}>
            <p className={cn("text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                <Icon className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> {label}
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)]">{value}</p>
        </div>
    );
}
