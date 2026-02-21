'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, User, Clock, Settings, Search } from 'lucide-react';
import { useCrmStore, DealStageType, Deal } from '@/stores/crmStore';
import { getDeals, updateDealStage } from '@/app/actions/crm/deals';
import { getCompanies } from '@/app/actions/crm/companies';
import { getContacts } from '@/app/actions/crm/contacts';
import { formatCurrency } from '@/lib/utils';
import NewDealModal from './NewDealModal';
import DealDetailDrawer from './DealDetailDrawer';

const COLUMNS: { id: DealStageType; title: string; color: string }[] = [
    { id: 'new_lead', title: 'New Lead', color: 'border-l-blue-500' },
    { id: 'qualified', title: 'Qualified', color: 'border-l-indigo-500' },
    { id: 'sample_sent', title: 'Sample Sent', color: 'border-l-purple-500' },
    { id: 'proposal', title: 'Proposal', color: 'border-l-yellow-500' },
    { id: 'negotiation', title: 'Negotiation', color: 'border-l-orange-500' },
    { id: 'closed_won', title: 'Closed Won', color: 'border-l-green-500' },
    { id: 'closed_lost', title: 'Closed Lost', color: 'border-l-red-500' },
];

export default function PipelineClient() {
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

    const [isLoading, setIsLoading] = useState(true);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceCol = result.source.droppableId as DealStageType;
        const destCol = result.destination.droppableId as DealStageType;

        if (sourceCol === destCol && result.source.index === result.destination.index) return;

        const dealId = result.draggableId;

        // Optimistic UI update
        moveDealOptimistic(dealId, destCol);

        // Server update
        const response = await updateDealStage(dealId, destCol as any);
        if (!response.success) {
            // Revert on failure by reloading
            loadData();
        }
    };

    const handleCardClick = (deal: Deal) => {
        setSelectedDeal(deal);
        setIsDealDrawerOpen(true);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 h-[calc(100vh-theme(spacing.16))] flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                <PageHeader title="Deals Pipeline" />
                <Button onClick={() => setIsNewDealModalOpen(true)} className="bg-[#E8A838] hover:bg-[#d69628] text-black w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Deal
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 h-full min-w-max">
                        {COLUMNS.map(column => {
                            const columnDeals = deals.filter(deal => deal.stage === column.id);
                            const columnTotal = columnDeals.reduce((sum, deal) => sum + Number(deal.value), 0);

                            return (
                                <div key={column.id} className="w-[300px] flex flex-col rounded-lg border flex-shrink-0" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                                    <div className="p-3 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                                        <div>
                                            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{column.title}</h3>
                                            <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                {formatCurrency(columnTotal)} • {columnDeals.length} deals
                                            </div>
                                        </div>
                                    </div>

                                    <Droppable droppableId={column.id}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[150px]"
                                            >
                                                {isLoading ? (
                                                    <div className="h-20 border-2 border-dashed rounded-lg flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
                                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</span>
                                                    </div>
                                                ) : columnDeals.map((deal, index) => (
                                                    <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={() => handleCardClick(deal)}
                                                                className={`p-3 rounded-lg border cursor-pointer shadow-sm hover:shadow-md transition-shadow border-l-4 ${column.color}`}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    background: 'var(--card)',
                                                                    borderColor: snapshot.isDragging ? 'var(--text-muted)' : '',
                                                                    opacity: snapshot.isDragging ? 0.9 : 1
                                                                }}
                                                            >
                                                                <div className="font-medium text-sm mb-1 leading-tight" style={{ color: 'var(--foreground)' }}>{deal.title}</div>
                                                                <div className="font-bold text-sm mb-2" style={{ color: 'var(--foreground)' }}>{formatCurrency(Number(deal.value))}</div>

                                                                <div className="space-y-1 mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                                                                    {deal.company?.name && (
                                                                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                                            <Building2 className="h-3 w-3" />
                                                                            <span className="truncate">{deal.company.name}</span>
                                                                        </div>
                                                                    )}
                                                                    {deal.client?.name && (
                                                                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                                            <User className="h-3 w-3" />
                                                                            <span className="truncate">{deal.client.name}</span>
                                                                        </div>
                                                                    )}
                                                                    {deal.expectedCloseDate && (
                                                                        <div className="flex items-center gap-1.5 text-[10px] mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                                            <Clock className="h-3 w-3" />
                                                                            {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="mt-3 flex gap-1 flex-wrap">
                                                                    {deal.priority === 'high' && (
                                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-red-200 bg-red-50 text-red-700 h-4">High</Badge>
                                                                    )}
                                                                    {deal.priority === 'medium' && (
                                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-200 bg-amber-50 text-amber-700 h-4">Medium</Badge>
                                                                    )}
                                                                    {deal.priority === 'low' && (
                                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-green-200 bg-green-50 text-green-700 h-4">Low</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
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
        </div>
    );
}
