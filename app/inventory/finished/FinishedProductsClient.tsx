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
import { Search, ArrowUpDown } from 'lucide-react';
import NewFinishedProductModal from '@/components/inventory/NewFinishedProductModal';
import LogMovementModal from '@/components/inventory/LogMovementModal';
import { getFinishedProducts } from '@/app/actions/inventory/finished-products';

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
    location: string;
    batchNumber: string | null;
    product: { id: string; name: string; skuPrefix: string };
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
                                    Retail <ArrowUpDown className="inline h-3 w-3 ml-1" />
                                </TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Location</TableHead>
                                <TableHead className="text-[var(--text-secondary)] text-right">Adjust</TableHead>
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
                                    const isLow = fp.availableStock <= 0;
                                    const isWarn = !isLow && fp.currentStock > 0 && fp.availableStock < fp.currentStock * 0.2;
                                    return (
                                        <TableRow key={fp.id} className={`border-b-[var(--border)] hover:bg-[var(--background)]/50 ${isLow ? 'bg-red-500/5' : isWarn ? 'bg-amber-500/5' : ''}`}>
                                            <TableCell className="font-medium text-[var(--text-primary)]">{fp.product.name}</TableCell>
                                            <TableCell className="text-[var(--text-secondary)]">{fp.variant}</TableCell>
                                            <TableCell className="text-[var(--text-muted)] font-mono text-xs">{fp.sku}</TableCell>
                                            <TableCell className="text-right text-[var(--text-primary)]">{fp.currentStock}</TableCell>
                                            <TableCell className="text-right text-[var(--text-secondary)]">{fp.reservedStock}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={isLow ? 'text-red-500 font-bold' : isWarn ? 'text-amber-500 font-semibold' : 'text-[var(--text-primary)]'}>
                                                    {fp.availableStock}
                                                </span>
                                                {isLow && <Badge className="ml-2 bg-red-500 text-white text-[10px]">Out</Badge>}
                                                {isWarn && <Badge className="ml-2 bg-amber-500 text-white text-[10px]">Low</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right text-[var(--text-primary)] whitespace-nowrap">{formatCurrency(fp.retailPrice)}</TableCell>
                                            <TableCell className="text-[var(--text-secondary)] text-xs">{fp.location.replace(/_/g, ' ')}</TableCell>
                                            <TableCell className="text-right">
                                                <LogMovementModal
                                                    targetType="finished"
                                                    targetId={fp.id}
                                                    targetName={`${fp.product.name} - ${fp.variant}`}
                                                    onSuccess={fetchProducts}
                                                />
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
