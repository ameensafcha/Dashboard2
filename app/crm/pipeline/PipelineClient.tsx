'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Building2,
    User,
    Clock,
    Search,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    TrendingUp,
    MoreHorizontal,
    ShoppingCart,
    Loader2
} from 'lucide-react';
import { useCrmStore, DealStageType, Deal } from '@/stores/crmStore';
import { getDeals, updateDealStage, convertDealToOrder } from '@/app/actions/crm/deals';
import { getCompanies } from '@/app/actions/crm/companies';
import { getContacts } from '@/app/actions/crm/contacts';
import { formatCurrency, cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import NewDealModal from './NewDealModal';
import DealDetailDrawer from './DealDetailDrawer';

export default function PipelineClient() {
    const { t, isRTL } = useTranslation();
    const {
        deals,
        setDeals,
        setCompanies,
        setContacts,
        moveDealOptimistic,
        setIsNewDealModalOpen,
        setSelectedDeal,
        setIsDealDrawerOpen
    } = useCrmStore();

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isConverting, setIsConverting] = useState(false);
    const [dealToConvert, setDealToConvert] = useState<Deal | null>(null);

    const COLUMNS: { id: DealStageType; title: string; color: string; bg: string }[] = [
        { id: 'new_lead', title: (t as any).stage_new_lead, color: 'border-blue-500', bg: 'bg-blue-500/5' },
        { id: 'qualified', title: (t as any).stage_qualified, color: 'border-indigo-500', bg: 'bg-indigo-500/5' },
        { id: 'sample_sent', title: (t as any).stage_sample_sent, color: 'border-cyan-500', bg: 'bg-cyan-500/5' },
        { id: 'proposal', title: (t as any).stage_proposal, color: 'border-[var(--primary)]', bg: 'bg-[var(--primary)]/5' },
        { id: 'negotiation', title: (t as any).stage_negotiation, color: 'border-purple-500', bg: 'bg-purple-500/5' },
        { id: 'closed_won', title: (t as any).stage_closed_won, color: 'border-emerald-500', bg: 'bg-emerald-500/5' },
        { id: 'closed_lost', title: (t as any).stage_closed_lost, color: 'border-red-500', bg: 'bg-red-500/5' },
    ];

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [dealsData, companiesData, contactsData] = await Promise.all([
                getDeals(),
                getCompanies(),
                getContacts()
            ]);
            setDeals(dealsData as any);
            setCompanies(companiesData as any);
            setContacts(contactsData as any);
        } catch (error) {
            console.error('Failed to load deals', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceCol = result.source.droppableId as DealStageType;
        const destCol = result.destination.droppableId as DealStageType;

        if (sourceCol === destCol && result.source.index === result.destination.index) return;

        const dealId = result.draggableId;
        moveDealOptimistic(dealId, destCol);

        const response = await updateDealStage(dealId, destCol as any);
        if (!response.success) {
            loadData();
        }
    };

    const handleCardClick = (deal: Deal) => {
        setSelectedDeal(deal);
        setIsDealDrawerOpen(true);
    };

    const handleConvertToOrder = async () => {
        if (!dealToConvert) return;

        setIsConverting(true);
        try {
            const result = await convertDealToOrder(dealToConvert.id);
            if (result.success) {
                toast({
                    title: t.success,
                    description: (t as any).successOrderConverted + ". Redirecting to complete order...",
                });
                router.push(`/sales/orders/${result.orderId}/edit`);
            } else {
                toast({
                    title: t.error,
                    description: result.error || (t as any).failedToConvert, // I should add failedToConvert too if I want but result.error is fine
                });
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred" });
        } finally {
            setIsConverting(false);
            setDealToConvert(null);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 h-[calc(100vh-theme(spacing.16))] flex flex-col overflow-hidden animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight uppercase flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-[var(--primary)]" />
                        {(t as any).dealsPipeline}
                    </h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-disabled)] mt-2">
                        Visual sales funnel & revenue forecasting
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setIsNewDealModalOpen(true)}
                        className="h-14 px-8 flex items-center justify-center rounded-2xl text-[11px] font-black uppercase tracking-widest text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 shadow-2xl shadow-[var(--primary)]/20 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4 mr-2" /> {(t as any).addDeal}
                    </Button>
                </div>
            </div>

            {/* Board Area */}
            <div className="flex-1 overflow-x-auto pb-6 scrollbar-hide">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-6 h-full min-w-max px-2">
                        {COLUMNS.map(column => {
                            const columnDeals = deals.filter(deal => deal.stage === column.id);
                            const columnTotal = columnDeals.reduce((sum, deal) => sum + Number(deal.value), 0);

                            return (
                                <div
                                    key={column.id}
                                    className="w-[320px] flex flex-col rounded-[2rem] border border-[var(--border)] overflow-hidden flex-shrink-0 bg-[var(--card)] shadow-xl shadow-black/5"
                                >
                                    <div className={cn("p-5 border-b border-[var(--border)]/50", column.bg)}>
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-black text-[10px] uppercase tracking-widest text-[var(--text-primary)]">{column.title}</h3>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)] font-black">
                                                {columnDeals.length}
                                            </Badge>
                                        </div>
                                        <div className="text-sm font-black text-[var(--primary)] tracking-tight">
                                            SAR {columnTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                        </div>
                                    </div>

                                    <Droppable droppableId={column.id}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="flex-1 p-4 space-y-4 overflow-y-auto min-h-[150px] scrollbar-hide"
                                            >
                                                {isLoading ? (
                                                    <div className="h-32 border-2 border-dashed rounded-3xl flex items-center justify-center border-[var(--border)] animate-pulse">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Synchronizing...</span>
                                                    </div>
                                                ) : columnDeals.map((deal, index) => {
                                                    const isLowValueLead = column.id === 'new_lead' && Number(deal.value) === 0;

                                                    return (
                                                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    onClick={() => handleCardClick(deal)}
                                                                    className={cn(
                                                                        "p-5 rounded-3xl border border-[var(--border)] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 relative group overflow-hidden border-l-4",
                                                                        column.color,
                                                                        snapshot.isDragging ? "rotate-2 scale-105 z-50 bg-[var(--primary)]/5" : "bg-[var(--card)]"
                                                                    )}
                                                                    style={{
                                                                        ...provided.draggableProps.style,
                                                                    }}
                                                                >
                                                                    <div className="flex items-start justify-between mb-3">
                                                                        <div className="min-w-0">
                                                                            <h4 className="font-black text-sm text-[var(--text-primary)] truncate leading-tight group-hover:text-[var(--primary)] transition-colors">{deal.title}</h4>
                                                                            <p className="text-[11px] font-bold text-[var(--text-disabled)] mt-0.5 truncate">
                                                                                {deal.company?.name || deal.client?.name || 'No contact'}
                                                                            </p>
                                                                        </div>
                                                                        {column.id === 'closed_won' && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 active:scale-90"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setDealToConvert(deal);
                                                                                }}
                                                                            >
                                                                                <ShoppingCart className="w-4 h-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-end justify-between mt-auto">
                                                                        <div className="space-y-1">
                                                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)]">
                                                                                {isLowValueLead ? (t as any).discoveryPhase : (t as any).estValue}
                                                                            </p>
                                                                            {isLowValueLead ? (
                                                                                <div className="h-6 flex items-center">
                                                                                    <Badge variant="ghost" className="p-0 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                                                                        {(t as any).requirementGathering}
                                                                                    </Badge>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-base font-black text-[var(--text-primary)] tracking-tighter">
                                                                                    SAR {Number(deal.value).toLocaleString()}
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {deal.priority && (
                                                                            <div className={cn(
                                                                                "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter",
                                                                                deal.priority === 'high' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                                                                    deal.priority === 'medium' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                                                                        "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                                            )}>
                                                                                {(t as any)[`priority_${deal.priority}`] || deal.priority}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {deal.expectedCloseDate && (
                                                                        <div className="mt-4 pt-3 border-t border-[var(--border)]/30 flex items-center justify-between text-[9px] font-bold text-[var(--text-disabled)] uppercase tracking-widest">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Clock className="w-3 h-3" />
                                                                                <span>{new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                                            </div>
                                                                            <TrendingUp className="w-3 h-3 text-emerald-500 opacity-50" />
                                                                        </div>
                                                                    )}

                                                                    {/* Hover Accent */}
                                                                    <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-[var(--primary)]/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            <NewDealModal onDealAdded={() => loadData()} />
            <DealDetailDrawer onDealUpdated={() => loadData()} />

            <AlertDialog open={!!dealToConvert} onOpenChange={(open) => !open && setDealToConvert(null)}>
                <AlertDialogContent className="rounded-[2rem] border-[var(--border)] bg-[var(--card)] p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">{(t as any).convertDealToOrder}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-bold text-[var(--text-secondary)]">
                            This will create a draft order for <span className="text-[var(--primary)]">{dealToConvert?.title}</span> with value <span className="text-[var(--primary)]">SAR {dealToConvert?.value ? Number(dealToConvert.value).toLocaleString() : 0}</span>.
                            <br /><br />
                            You can further customize the order (add items, taxes, etc.) in the sales module.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-6">
                        <AlertDialogCancel className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">No, Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConvertToOrder();
                            }}
                            className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                            disabled={isConverting}
                        >
                            {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : (t as any).save}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
