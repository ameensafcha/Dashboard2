'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
    LayoutGrid,
    Search,
    Plus,
    Calendar,
    Flag,
    MoreVertical,
    CheckSquare
} from "lucide-react";
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useQuery } from '@tanstack/react-query';
import { getTasks, updateTask } from '@/app/actions/tasks/tasks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasksStore } from '@/stores/tasksStore';
import NewTaskModal from './NewTaskModal';
import TaskDetailDrawer from './TaskDetailDrawer';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { toast } from '@/components/ui/toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// IMPORTANT: Full drag-and-drop kanban usually requires something like sortablejs or react-beautiful-dnd.
// Given strict reliance on standard UI components or simple standard browser drag events without external heavy deps if possible,
// we will implement a lightweight custom HTML5 drag and drop here for the columns.

interface TasksBoardProps {
    initialTasks: any[];
    businessSlug: string;
}

export default function TasksBoardClient({ initialTasks, businessSlug }: TasksBoardProps) {
    const { t, isRTL } = useTranslation();
    const { setIsNewTaskModalOpen, setSelectedTaskId, setIsDetailDrawerOpen } = useTasksStore();

    const [search, setSearch] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL'); // Stubbed for now since we don't have user list fetching easily available here yet.

    const { data: tasks, refetch: refetchTasks } = useQuery({
        queryKey: ['tasks', businessSlug, assigneeFilter, 'ALL'],
        queryFn: () => getTasks(businessSlug, assigneeFilter, 'ALL'),
        initialData: initialTasks,
        staleTime: 5_000,
        refetchInterval: 30_000,
    });

    const refreshData = () => {
        refetchTasks();
    };

    const handleTaskClick = (id: string) => {
        setSelectedTaskId(id);
        setIsDetailDrawerOpen(true);
    };

    const selectedTask = tasks?.find(t => t.id === useTasksStore.getState().selectedTaskId);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'MEDIUM': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'LOW': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    // --- Drag and Drop Logic ---

    const [isDragging, setIsDragging] = useState(false);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setIsDragging(true);
        setDraggedTaskId(id);
        e.dataTransfer.effectAllowed = 'move';
        // We can just store ID in state rather than dataTransfer for simplicity within the same component
    };

    const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        setDragOverStatus(status);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
        e.preventDefault();
        setDragOverStatus(null);
        setIsDragging(false);

        if (!draggedTaskId) return;

        const taskToMove = tasks?.find(t => t.id === draggedTaskId);
        if (!taskToMove || taskToMove.status === newStatus) return;

        // Optimistic UI could go here by altering the cached `tasks`

        try {
            const res = await updateTask(draggedTaskId, { status: newStatus });
            if (res.success) {
                // We rely on toast or just silent success in drag drop
                refetchTasks();
            } else {
                toast({ title: 'Error', description: res.error, type: 'error' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to move task.', type: 'error' });
        } finally {
            setDraggedTaskId(null);
        }
    };

    const filteredTasks = tasks?.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    ) || [];

    const columns: { status: TaskStatus, title: string, color: string }[] = [
        { status: TaskStatus.TODO, title: 'To Do', color: 'border-zinc-500/30' },
        { status: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'border-blue-500/30' },
        { status: TaskStatus.IN_REVIEW, title: 'In Review', color: 'border-amber-500/30' },
        { status: TaskStatus.DONE, title: 'Done', color: 'border-emerald-500/30' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10 flex flex-col h-[calc(100vh-80px)] overflow-hidden pt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Team Tasks</h1>
                    <p className="text-sm text-[var(--text-disabled)] mt-1">Manage pipeline and collaborate on work.</p>
                </div>
                <PermissionGuard module="crm" action="create">
                    <Button
                        onClick={() => setIsNewTaskModalOpen(true)}
                        className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[var(--primary)]/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                    </Button>
                </PermissionGuard>
            </div>

            {/* Toolbar */}
            <div className="px-6 shrink-0">
                <div className="p-4 border border-[var(--border)] bg-[var(--card)] rounded-2xl flex flex-col sm:flex-row gap-4 shadow-sm">
                    <div className="relative w-full sm:w-96 flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
                        <Input
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-10 bg-[var(--muted)]/30 border-[var(--border)] rounded-xl font-medium focus:ring-[var(--primary)]"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Assignee Filter Stub */}
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="w-[180px] h-10 bg-[var(--muted)]/30 border-[var(--border)] rounded-xl font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                <SelectValue placeholder="Assignee" />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                <SelectItem value="ALL" className="font-bold text-xs">All Users</SelectItem>
                                {/* Will populate when user endpoint exists */}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Kanban Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
                <div className="flex gap-6 h-full min-w-[max-content]">
                    {columns.map(col => {
                        const columnTasks = filteredTasks.filter(t => t.status === col.status);

                        return (
                            <div
                                key={col.status}
                                className={cn(
                                    "flex flex-col w-[320px] bg-[var(--muted)]/20 rounded-2xl border border-[var(--border)] h-full transition-colors",
                                    dragOverStatus === col.status ? "bg-[var(--primary)]/5 border-[var(--primary)]/30 border-dashed" : ""
                                )}
                                onDragOver={(e) => handleDragOver(e, col.status)}
                                onDrop={(e) => handleDrop(e, col.status)}
                            >
                                {/* Column Header */}
                                <div className={cn("p-4 shrink-0 border-b", col.color)}>
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">{col.title}</h3>
                                        <span className="w-6 h-6 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[10px] font-black text-[var(--text-secondary)] shadow-sm">
                                            {columnTasks.length}
                                        </span>
                                    </div>
                                    {dragOverStatus === col.status && (
                                        <div className="h-1 w-full bg-[var(--primary)]/30 rounded-full mt-2 animate-pulse" />
                                    )}
                                </div>

                                {/* Column Content (Scrollable) */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                    {columnTasks.map(task => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            onDragEnd={() => setIsDragging(false)}
                                            onClick={() => handleTaskClick(task.id)}
                                            className={cn(
                                                "p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm hover:border-[var(--primary)]/50 cursor-pointer transition-all hover:shadow-md group",
                                                draggedTaskId === task.id ? "opacity-40 scale-95" : "opacity-100 scale-100"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={cn("px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest border", getPriorityColor(task.priority))}>
                                                    {task.priority}
                                                </span>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-[var(--text-disabled)] hover:text-[var(--text-primary)]">
                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTaskClick(task.id); }} className="text-xs font-bold cursor-pointer">Edit Task</DropdownMenuItem>
                                                        {/* Status advances could go here */}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <h4 className="text-sm font-black text-[var(--text-primary)] leading-snug mb-2 group-hover:text-[var(--primary)] transition-colors">{task.title}</h4>

                                            {task.description && (
                                                <p className="text-[11px] font-medium text-[var(--text-disabled)] line-clamp-2 leading-relaxed mb-4">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]/50">
                                                <div className="flex items-center gap-2">
                                                    {task.dueDate && (
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold",
                                                            new Date(task.dueDate) < new Date() && task.status !== 'DONE'
                                                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                                : "bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)]"
                                                        )}>
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    )}
                                                </div>
                                                <Avatar className="h-6 w-6 border border-[var(--border)] ring-2 ring-[var(--card)]">
                                                    <AvatarFallback className="bg-[var(--muted)] text-[9px] font-black text-[var(--text-secondary)]">
                                                        {task.assignedTo ? `${task.assignedTo.firstName[0]}${task.assignedTo.lastName[0]}` : task.createdBy?.firstName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </div>
                                    ))}

                                    {columnTasks.length === 0 && (
                                        <div className="flex flex-col items-center justify-center p-6 text-center h-40 border-2 border-dashed border-[var(--border)] rounded-xl opacity-50">
                                            <CheckSquare className="w-6 h-6 text-[var(--text-disabled)] mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">No tasks</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <NewTaskModal onTaskAdded={refreshData} />
            <TaskDetailDrawer task={selectedTask} onUpdated={refreshData} />
        </div>
    );
}
