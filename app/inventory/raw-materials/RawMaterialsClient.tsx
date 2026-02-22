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
import { cn } from '@/lib/utils';
import { useInventoryStore, RawMaterialData } from '@/stores/inventoryStore';
import { getRawMaterials } from '@/app/actions/inventory/raw-materials';
import { useTranslation } from '@/lib/i18n';
import NewMaterialModal from '@/components/inventory/NewMaterialModal';
import LogMovementModal from '@/components/inventory/LogMovementModal';

interface Props {
    initialMaterials: RawMaterialData[];
    suppliers?: { id: string; name: string; isActive: boolean }[];
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

    const getTranslatedCategory = (cat: string) => {
        switch (cat) {
            case 'BASE_POWDER': return t.basePowder;
            case 'FLAVORING': return t.flavoring;
            case 'PACKAGING': return t.packaging;
            case 'OTHER': return t.other;
            default: return cat;
        }
    };

    const getTranslatedLocation = (loc: string) => {
        switch (loc) {
            case 'AL_AHSA_WAREHOUSE': return t.alAhsaWarehouse;
            case 'KHOBAR_OFFICE': return t.khobarOffice;
            default: return loc;
        }
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
                    <PageHeader title={t.rawMaterials} />
                    <p className="text-[var(--text-secondary)] text-sm -mt-1 mb-2">
                        {t.trackInventoryMsg}
                    </p>
                </div>
                <NewMaterialModal onSuccess={fetchMaterials} suppliers={suppliers} />
            </div>

            <Card className="p-4 bg-[var(--card)] border-[var(--border)] overflow-hidden">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className={cn(
                            "absolute top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] h-4 w-4 opacity-50",
                            isRTL ? "right-3" : "left-3"
                        )} />
                        <Input
                            placeholder={t.searchMaterials}
                            className={cn(
                                "bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-[#E8A838] focus:border-[#E8A838]",
                                isRTL ? "pr-9" : "pl-9"
                            )}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-[180px]">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-[#E8A838]">
                                    <SelectValue placeholder={t.category} />
                                </SelectTrigger>
                                <SelectContent className="z-[100] bg-[var(--card)] border-[var(--border)]">
                                    <SelectItem value="all">{t.allCategories}</SelectItem>
                                    <SelectItem value="BASE_POWDER">{t.basePowder}</SelectItem>
                                    <SelectItem value="FLAVORING">{t.flavoring}</SelectItem>
                                    <SelectItem value="PACKAGING">{t.packaging}</SelectItem>
                                    <SelectItem value="OTHER">{t.other}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[180px]">
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-[#E8A838]">
                                    <SelectValue placeholder={t.location} />
                                </SelectTrigger>
                                <SelectContent className="z-[100] bg-[var(--card)] border-[var(--border)]">
                                    <SelectItem value="all">{t.allLocations}</SelectItem>
                                    <SelectItem value="AL_AHSA_WAREHOUSE">{t.alAhsaWarehouse}</SelectItem>
                                    <SelectItem value="KHOBAR_OFFICE">{t.khobarOffice}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-[var(--muted)]">
                            <TableRow className="border-b-[var(--border)] hover:bg-transparent">
                                <TableHead className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider">{t.name}</TableHead>
                                <TableHead className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider">{t.category}</TableHead>
                                <TableHead className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider">{t.location}</TableHead>
                                <TableHead
                                    className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider text-right cursor-pointer hover:text-[var(--accent-gold)] transition-colors"
                                    onClick={() => handleSort('currentStock')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        {t.stockLevel}
                                        <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider text-right cursor-pointer hover:text-[var(--accent-gold)] transition-colors"
                                    onClick={() => handleSort('unitCost')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        {t.price}
                                        <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider text-right">{t.adjust}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-[var(--text-secondary)]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin" />
                                            {t.loading || 'Loading inventory...'}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sortedMaterials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-[var(--text-secondary)]">
                                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">
                                            {t.noMaterialsFound || 'No materials found'}
                                        </h3>
                                        <p className="text-sm opacity-60">
                                            {t.noFilters || 'Try adjusting your filters'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedMaterials.map((material) => {
                                    const isLowStock = material.reorderThreshold !== null && material.currentStock <= material.reorderThreshold;

                                    return (
                                        <TableRow
                                            key={material.id}
                                            className="border-b-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors group cursor-pointer"
                                            onClick={() => openMaterialDrawer(material.id)}
                                        >
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                                                        {material.name}
                                                        {isLowStock && (
                                                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 h-5 text-[10px] px-1.5 flex items-center gap-1">
                                                                <AlertTriangle className="h-3 w-3" /> {t.lowStock}
                                                            </Badge>
                                                        )}
                                                    </span>
                                                    <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-wider mt-0.5 opacity-60">
                                                        {material.sku}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)] font-medium">
                                                    {getTranslatedCategory(material.category)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-[var(--text-secondary)] text-sm">
                                                {getTranslatedLocation(material.location)}
                                            </TableCell>
                                            <TableCell className={cn(
                                                "text-right font-bold transition-colors",
                                                isLowStock ? 'text-red-500' : 'text-[var(--accent-gold)]'
                                            )}>
                                                {material.currentStock} <span className="text-[10px] opacity-60 uppercase ml-0.5">
                                                    {material.category === 'PACKAGING' ? t.units : t.kg}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-[var(--text-primary)] font-medium font-mono">
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
