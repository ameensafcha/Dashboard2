'use client';

import Image from 'next/image';
import { useAppStore } from '@/stores/appStore';
import { productStatuses, sfdaStatuses } from '@/app/actions/product/types';
import { Edit, Package, Trash2, Calendar, Coffee, FileCheck, DollarSign, Scale, Hash, LayoutGrid, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductsResponse } from '@/app/actions/product/actions';

type ProductType = ProductsResponse['products'][0];

interface ProductViewModalProps {
    product: ProductType | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (product: ProductType, e: React.MouseEvent) => void;
    onDelete: (productId: string, e: React.MouseEvent) => void;
}

const statusColors: Record<string, string> = {
    active: 'bg-[#2D6A4F] text-white',
    in_development: 'bg-[#E8A838] text-black',
    discontinued: 'bg-[#D32F2F] text-white',
};

export default function ProductViewModal({
    product,
    isOpen,
    onClose,
    onEdit,
    onDelete,
}: ProductViewModalProps) {
    const { isRTL } = useAppStore();

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-0 shadow-2xl rounded-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
                                {product.name}
                                <Badge className={statusColors[product.status]}>
                                    {productStatuses.find(s => s.value === product.status)?.label}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                                <Hash className="w-3 h-3" /> {product.skuPrefix}
                            </DialogDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={(e) => onEdit(product, e)}
                                className="bg-[#E8A838] hover:bg-[#d49a2d] text-black gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                {isRTL ? 'تعديل' : 'Edit'}
                            </Button>
                            <Button
                                size="sm"
                                onClick={(e) => onDelete(product.id, e)}
                                variant="destructive"
                                className="bg-[#D32F2F] hover:bg-[#b71c1c] text-white gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isRTL ? 'حذف' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
                    {/* Left Column - Image */}
                    <div className="w-full md:w-1/3 shrink-0">
                        <div className="aspect-square relative rounded-xl overflow-hidden bg-muted/50 border shadow-inner flex items-center justify-center group">
                            {product.image ? (
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
                                    <Package className="w-20 h-20 mb-4 opacity-50" />
                                    <span className="text-sm">No image available</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-4 bg-muted/20 p-4 rounded-xl border">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pricing Snapshot</h4>
                            <div className="flex justify-between items-center pb-2 border-b border-border/50">
                                <span className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 opacity-70" /> {isRTL ? 'التكلفة' : 'Base Cost'}</span>
                                <span className="font-medium text-foreground">SAR {Number(product.baseCost).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-sm flex items-center gap-2"><Tag className="w-4 h-4 opacity-70" /> {isRTL ? 'سعر البيع' : 'Retail Price'}</span>
                                <span className="font-bold text-lg text-[#E8A838]">SAR {Number(product.baseRetailPrice).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="w-full md:w-2/3 space-y-8">
                        {/* Core Details Grid */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                                <FileCheck className="w-5 h-5 opacity-70" />
                                {isRTL ? 'المعلومات الأساسية' : 'Core Details'}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> {isRTL ? 'الفئة' : 'Category'}</p>
                                    <p className="font-medium text-foreground bg-muted/30 px-3 py-1.5 rounded-md inline-block">
                                        {product.category?.name || 'Uncategorized'}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Scale className="w-4 h-4" /> {isRTL ? 'الحجم' : 'Size'}</p>
                                    <p className="font-medium text-foreground bg-muted/30 px-3 py-1.5 rounded-md inline-block">
                                        {product.size ? `${Number(product.size)} ${product.unit || ''}` : 'N/A'}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Coffee className="w-4 h-4" /> {isRTL ? 'خالي من الكافيين' : 'Caffeine-free'}</p>
                                    <Badge variant={product.caffeineFree ? 'default' : 'secondary'} className={product.caffeineFree ? 'bg-[#2D6A4F]' : ''}>
                                        {product.caffeineFree ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}
                                    </Badge>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> {isRTL ? 'تاريخ الإطلاق' : 'Launch Date'}</p>
                                    <p className="font-medium text-foreground bg-muted/30 px-3 py-1.5 rounded-md inline-block">
                                        {product.launchDate ? new Date(product.launchDate).toLocaleDateString() : 'TBD'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Regulatory & Description Grid */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                                <FileCheck className="w-5 h-5 opacity-70" />
                                {isRTL ? 'تفاصيل إضافية' : 'Additional Information'}
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 bg-muted/10 p-4 rounded-xl border border-border/50">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">{isRTL ? 'الحالة FDA' : 'SFDA Status'}</p>
                                        <Badge className={product.sfdaStatus === 'approved' ? 'bg-[#2D6A4F] text-white' : product.sfdaStatus === 'pending' ? 'bg-[#E8A838] text-black' : 'bg-gray-400 text-white'}>
                                            {sfdaStatuses.find(s => s.value === product.sfdaStatus)?.label}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">{isRTL ? 'المرجع FDA' : 'SFDA Reference'}</p>
                                        <p className="font-mono text-sm bg-background px-3 py-2 rounded-md border">{product.sfdaReference || 'N/A'}</p>
                                    </div>
                                </div>

                                {product.keyIngredients && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">{isRTL ? 'المكونات' : 'Key Ingredients'}</p>
                                        <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed border border-border/50">
                                            {product.keyIngredients}
                                        </div>
                                    </div>
                                )}

                                {product.description && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">{isRTL ? 'الوصف' : 'Description'}</p>
                                        <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed border border-border/50 whitespace-pre-wrap">
                                            {product.description}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
