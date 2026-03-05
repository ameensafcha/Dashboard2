'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
    Calendar,
    Users,
    MapPin,
    Target,
    Search,
    Plus,
    Activity
} from "lucide-react";
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useQuery } from '@tanstack/react-query';
import { getEventsOverview, getEvents } from '@/app/actions/events/events';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEventsStore } from '@/stores/eventsStore';
import NewEventModal from './NewEventModal';
import EventDetailDrawer from './EventDetailDrawer';
import { EventStatus, EventType } from '@prisma/client';
import Link from 'next/link';

export default function EventsOverviewClient({ data: initialData, initialEvents, businessSlug }: { data: any, initialEvents: any[], businessSlug: string }) {
    const { t, isRTL } = useTranslation();
    const { setIsNewEventModalOpen, setSelectedEventId, setIsDetailDrawerOpen } = useEventsStore();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');

    const { data: overview, refetch: refetchOverview } = useQuery({
        queryKey: ['events-overview', businessSlug],
        queryFn: () => getEventsOverview(businessSlug),
        initialData,
        staleTime: 10_000,
        refetchInterval: 30_000,
    });

    const { data: events, refetch: refetchEvents } = useQuery({
        queryKey: ['events', businessSlug, search, statusFilter, typeFilter],
        queryFn: () => getEvents(businessSlug, search, statusFilter, typeFilter),
        initialData: initialEvents,
        staleTime: 10_000,
        refetchInterval: 30_000,
    });

    const refreshData = () => {
        refetchOverview();
        refetchEvents();
    };

    const handleRowClick = (id: string, e: React.MouseEvent) => {
        // Simple hack: if they clicked a button/link, don't open drawer
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;

        setSelectedEventId(id);
        setIsDetailDrawerOpen(true);
    };

    const kpis = [
        {
            title: 'Total Events',
            value: overview?.totalEvents || 0,
            icon: <Calendar className="w-5 h-5 text-blue-400" />,
            color: "text-blue-400",
            bg: "bg-blue-400/5",
            border: "border-blue-400/10"
        },
        {
            title: 'Upcoming',
            value: overview?.upcoming || 0,
            icon: <Activity className="w-5 h-5 text-amber-500" />,
            color: "text-amber-500",
            bg: "bg-amber-400/5",
            border: "border-amber-400/10"
        },
        {
            title: 'Total Leads Captured',
            value: overview?.totalLeads || 0,
            icon: <Users className="w-5 h-5 text-purple-400" />,
            color: "text-purple-400",
            bg: "bg-purple-400/5",
            border: "border-purple-400/10"
        },
        {
            title: 'Conversion Rate',
            value: overview?.conversionRate || 0,
            suffix: '%',
            icon: <Target className="w-5 h-5 text-emerald-500" />,
            color: "text-emerald-500",
            bg: "bg-emerald-400/5",
            border: "border-emerald-400/10"
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'PLANNING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'COMPLETED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    const selectedEvent = events?.find(e => e.id === useEventsStore.getState().selectedEventId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 pt-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Events & Expos</h1>
                    <p className="text-sm text-[var(--text-disabled)] mt-1">Manage exhibitions, track leads, and monitor ROI.</p>
                </div>
                <PermissionGuard module="events" action="create">
                    <Button
                        onClick={() => setIsNewEventModalOpen(true)}
                        className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[var(--primary)]/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Event
                    </Button>
                </PermissionGuard>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
                {kpis.map((kpi, i) => (
                    <Card key={i} className="p-6 border-[var(--border)] bg-[var(--card)] rounded-2xl hover:border-[var(--primary)]/40 transition-all border-b-4 border-b-transparent hover:border-b-[var(--primary)] shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{kpi.title}</p>
                                <h3 className={cn("text-2xl font-black tracking-tight", kpi.color)}>
                                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : kpi.value}{kpi.suffix}
                                </h3>
                            </div>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", kpi.bg, kpi.border)}>
                                {kpi.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Toolbar & Table */}
            <div className="px-6">
                <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/10 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
                            <Input
                                placeholder="Search events or venues..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10 bg-[var(--card)] border-[var(--border)] rounded-xl font-medium focus:ring-[var(--primary)]"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-10 bg-[var(--card)] border-[var(--border)] rounded-xl font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                    <SelectItem value="ALL" className="font-bold text-xs">All Statuses</SelectItem>
                                    {Object.values(EventStatus).map(s => (
                                        <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[140px] h-10 bg-[var(--card)] border-[var(--border)] rounded-xl font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                    <SelectItem value="ALL" className="font-bold text-xs">All Types</SelectItem>
                                    {Object.values(EventType).map(t => (
                                        <SelectItem key={t} value={t} className="font-bold text-xs">{t.replace('_', ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border)]/50 bg-[var(--muted)]/5">
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Event</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Status</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Type</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Location</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Date</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-center" : "text-center")}>Leads</th>
                                    <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] whitespace-nowrap", isRTL ? "text-right" : "text-left")}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]/20">
                                {events?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <p className="text-sm font-bold text-[var(--text-disabled)]">No events found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    events?.map((event: any) => (
                                        <tr
                                            key={event.id}
                                            onClick={(e) => handleRowClick(event.id, e)}
                                            className="group hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{event.name}</p>
                                                    <p className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-wider mt-0.5">{event.eventId}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn("px-2.5 py-1 rounded-md text-[9px] font-black uppercase border", getStatusColor(event.status))}>
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                                    {event.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-[var(--text-disabled)]" />
                                                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                                                        {event.venue || event.city ? `${event.venue}${event.venue && event.city ? ', ' : ''}${event.city}` : 'TBD'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-[var(--text-secondary)]">
                                                    {new Date(event.startDate).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-black">
                                                    {event._count?.leads || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    className="h-8 px-3 text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"
                                                >
                                                    <Link href={`/${businessSlug}/events/${event.id}`}>
                                                        Manage
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <NewEventModal onEventAdded={refreshData} />
            <EventDetailDrawer event={selectedEvent} onUpdated={refreshData} />
        </div>
    );
}
