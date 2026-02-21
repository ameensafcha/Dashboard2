'use client';

import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Search, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { useInventoryStore, RawMaterialData } from '@/stores/inventoryStore';
import { getRawMaterials } from '@/app/actions/inventory/raw-materials';
import { useTranslation } from '@/lib/i18n';
import NewMaterialModal from '@/components/inventory/NewMaterialModal';
import LogMovementModal from '@/components/inventory/LogMovementModal';

interface Props {
    initialMaterials: RawMaterialData[];
    suppliers?: { id: string; name: string }[];
}

export default function RawMaterialsClient({ initialMaterials, suppliers = [] }: Props) {
    const { rawMaterials, setRawMaterials, isLoading, setIsLoading, openMaterialDrawer } = useInventoryStore();
    const { t, isRTL } = useTranslation();

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');

    const [sortConfig, setSortConfig] = useState<{ key: keyof RawMaterialData; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        // Hydrate store on mount
        if (initialMaterials.length > 0 && rawMaterials.length === 0) {
            setRawMaterials(initialMaterials);
            setIsLoading(false);
        } else if (rawMaterials.length === 0) {
            fetchMaterials();
        }
    }, []);

    const fetchMaterials = async () => {
        setIsLoading(true);
        const result = await getRawMaterials(
            searchQuery || undefined,
            categoryFilter as any,
            locationFilter as any
        );
        if (result.success && result.materials) {
            setRawMaterials(result.materials);
        }
        setIsLoading(false);
    };

    // Refetch when filters change
    useEffect(() => {
        // Debounce search slightly
        const timer = setTimeout(() => {
            fetchMaterials();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, categoryFilter, locationFilter]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: 'SAR'
        }).format(amount);
    };

    const formatCategory = (cat: string) => {
        return cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    // Client-side sorting
    const sortedMaterials = useMemo(() => {
        let sortableItems = [...rawMaterials];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                if (aVal < bVal) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [rawMaterials, sortConfig]);

    const handleSort = (key: keyof RawMaterialData) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <PageHeader title="Raw Materials" />
                    <p className="text-[var(--text-secondary)] text-sm -mt-1 mb-2">
                        Track raw ingredients and packaging supplies.
                    </p>
                </div>
                <NewMaterialModal onSuccess={fetchMaterials} suppliers={suppliers} />
            </div>

            <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
                        <Input
                            placeholder="Search materials by name or SKU..."
                            className="pl-9 bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-[180px]">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="BASE_POWDER">Base Powder</SelectItem>
                                    <SelectItem value="FLAVORING">Flavoring</SelectItem>
                                    <SelectItem value="PACKAGING">Packaging</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[180px]">
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]">
                                    <SelectValue placeholder="Location" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    <SelectItem value="all">All Locations</SelectItem>
                                    <SelectItem value="AL_AHSA_WAREHOUSE">Al-Ahsa Warehouse</SelectItem>
                                    <SelectItem value="KHOBAR_OFFICE">Khobar Office</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="rounded-md border border-[var(--border)] overflow-hidden">
                    <Table>
                        <TableHeader className="bg-[var(--background)]">
                            <TableRow className="border-b-[var(--border)] hover:bg-transparent">
                                <TableHead className="text-[var(--text-secondary)]">Item</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Category</TableHead>
                                <TableHead className="text-[var(--text-secondary)]">Location</TableHead>
                                <TableHead
                                    className="text-[var(--text-secondary)] text-right cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                                    onClick={() => handleSort('currentStock')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Stock Level
                                        <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="text-[var(--text-secondary)] text-right cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                                    onClick={() => handleSort('unitCost')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Unit Cost
                                        <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[var(--text-secondary)] text-right">Adjust</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                                        Loading inventory...
                                    </TableCell>
                                </TableRow>
                            ) : sortedMaterials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-[var(--text-muted)]">
                                        No raw materials found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedMaterials.map((material) => {
                                    const isLowStock = material.reorderThreshold !== null && material.currentStock <= material.reorderThreshold;

                                    return (
                                        <TableRow
                                            key={material.id}
                                            className="border-b-[var(--border)] hover:bg-[var(--background)]/50 cursor-pointer"
                                            onClick={() => openMaterialDrawer(material.id)}
                                        >
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[var(--text-primary)] font-medium flex items-center gap-2">
                                                        {material.name}
                                                        {isLowStock && (
                                                            <Badge variant="destructive" className="h-5 text-[10px] px-1.5 flex items-center gap-1">
                                                                <AlertTriangle className="h-3 w-3" /> Low Stock
                                                            </Badge>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{material.sku}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] font-normal">
                                                    {formatCategory(material.category)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-[var(--text-secondary)] text-sm">
                                                {formatCategory(material.location)}
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${isLowStock ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
                                                {material.currentStock} {material.category === 'PACKAGING' ? 'units' : 'kg'}
                                            </TableCell>
                                            <TableCell className="text-right text-[var(--text-secondary)]">
                                                {formatCurrency(material.unitCost)}
                                            </TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <LogMovementModal
                                                    targetType="raw"
                                                    targetId={material.id}
                                                    targetName={material.name}
                                                    onSuccess={fetchMaterials}
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

            {/* <MaterialDetailDrawer /> */}
        </div>
    );
}
