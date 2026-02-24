'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, ArrowUpDown, Pencil } from 'lucide-react';
import NewFinishedProductModal from '@/components/inventory/NewFinishedProductModal';
import EditFinishedProductModal from '@/components/inventory/EditFinishedProductModal';
import LogMovementModal from '@/components/inventory/LogMovementModal';
import { getFinishedProducts } from '@/app/actions/inventory/finished-products';
import { cn } from '@/lib/utils';

interface FinishedProductData {
    id: string;
    productId: string;
    variant: string;
    sku: string;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    unitCost: number;
    retailPrice: number;
    reorderThreshold: number | null;
    location: string;
    batchNumber: string | null;
    expiryDate: Date | string | null;
    product: { id: string; name: string; skuPrefix: string } | null;
}

interface Props {
    initialProducts: FinishedProductData[];
    catalogProducts: { id: string; name: string; skuPrefix: string }[];
}

export default function FinishedProductsClient({ initialProducts, catalogProducts }: Props) {
    const [products, setProducts] = useState(initialProducts);
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('ALL');
    const [sortField, setSortField] = useState<'currentStock' | 'retailPrice'>('currentStock');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<FinishedProductData | null>(null);

    const fetchProducts = async () => {
        const result = await getFinishedProducts(searchQuery || undefined, locationFilter);
        if (result.success) setProducts(result.products as any);
    };

    useEffect(() => { fetchProducts(); }, [searchQuery, locationFilter]);

    const sorted = [...products].sort((a, b) => {
        const val = sortDir === 'asc' ? 1 : -1;
        return ((a as any)[sortField] - (b as any)[sortField]) * val;
    });

    const toggleSort = (field: 'currentStock' | 'retailPrice') => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const formatCurrency = (v: number) => `SAR ${v.toLocaleString('en-SA', { minimumFractionDigits: 2 })}`;

    const handleEdit = (fp: FinishedProductData) => {
        setEditingProduct(fp);
        setIsEditModalOpen(true);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <PageHeader title="Finished Products" />
                    <p className="text-[var(--text-secondary)] text-sm -mt-1 mb-2">
                        Track sellable product inventory and reservations.
                    </p>
                </div>
                <NewFinishedProductModal onSuccess={fetchProducts} catalogProducts={catalogProducts} />
            </div>

            {editingProduct && (
                <EditFinishedProductModal
                    key={editingProduct.id}
                    product={editingProduct}
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    onSuccess={fetchProducts}
                />
            )}

            <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
                        <Input
                            placeholder="Search by product, variant or SKU..."
                            className="pl-9 bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="w-[180px] bg-[var(--background)] border-[var(--border)]">
                            <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Locations</SelectItem>
                            <SelectItem value="AL_AHSA_WAREHOUSE">Al-Ahsa Warehouse</SelectItem>
                            <SelectItem value="KHOBAR_OFFICE">Khobar Office</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="rounded-md border border-[var(--border)] overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-[var(--background)]">
                            <TableRow className="border-b-[var(--border)] hover:bg-transparent">
                                <TableHead className="text-[var(--text-secondary)]">Product</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Variant</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">SKU</TableHead>
                                <TableHead className="text-[var(--text-secondary)] text-right cursor-pointer" onClick={() => toggleSort('currentStock')}>
                                    Stock <ArrowUpDown className="inline h-3 w-3 ml-1" />
                                </TableHead>
                                <TableHead className="text-[var(--text-secondary)] text-right">Reserved</TableHead>
                                <TableHead className="text-[var(--text-secondary)] text-right">Available</TableHead>
                                <TableHead className="text-[var(--text-secondary)] text-right cursor-pointer" onClick={() => toggleSort('retailPrice')}>
                                    Retail Price <ArrowUpDown className="inline h-3 w-3 ml-1" />
                                </TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Location</TableHead>
                                <TableHead className="text-[var(--text-secondary)] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sorted.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12 text-[var(--text-muted)]">
                                        No finished products found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sorted.map((fp) => {
                                    const available = fp.currentStock - fp.reservedStock;
                                    const threshold = fp.reorderThreshold ?? null;
                                    const isLow = available <= 0;
                                    const isWarn = !isLow && threshold !== null && available <= threshold;
                                    return (
                                        <TableRow key={fp.id} className={cn(
                                            "border-b-[var(--border)] hover:bg-[var(--background)]/50",
                                            isLow ? 'bg-red-500/5' : isWarn ? 'bg-amber-500/5' : ''
                                        )}>
                                            <TableCell className="font-medium text-[var(--text-primary)]">{fp.product?.name || 'Unknown Product'}</TableCell>
                                            <TableCell className="text-[var(--text-secondary)]">{fp.variant}</TableCell>
                                            <TableCell className="text-[var(--text-muted)] font-mono text-xs">{fp.sku}</TableCell>
                                            <TableCell className="text-right text-[var(--text-primary)]">{fp.currentStock}</TableCell>
                                            <TableCell className="text-right text-[var(--text-secondary)]">{fp.reservedStock}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={isLow ? 'text-red-500 font-bold' : isWarn ? 'text-amber-500 font-semibold' : 'text-[var(--text-primary)]'}>
                                                    {available}
                                                </span>
                                                {isLow && <Badge className="ml-2 bg-red-500 text-white text-[10px]">Out</Badge>}
                                                {isWarn && <Badge className="ml-2 bg-amber-500 text-white text-[10px]">Low</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right text-[var(--text-primary)] whitespace-nowrap font-black text-[#E8A838]">
                                                {formatCurrency(fp.retailPrice)}
                                            </TableCell>
                                            <TableCell className="text-[var(--text-secondary)] text-xs">{fp.location.replace(/_/g, ' ')}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-[#E8A838] hover:text-[#E8A838] hover:bg-[#E8A838]/10"
                                                        onClick={() => handleEdit(fp)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <LogMovementModal
                                                        targetType="finished"
                                                        targetId={fp.id}
                                                        targetName={`${fp.product?.name || 'Unknown'} - ${fp.variant}`}
                                                        onSuccess={fetchProducts}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
