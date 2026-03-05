import { create } from 'zustand';

interface TasksState {
    isNewTaskModalOpen: boolean;
    setIsNewTaskModalOpen: (isOpen: boolean) => void;
    selectedTaskId: string | null;
    setSelectedTaskId: (id: string | null) => void;
    isDetailDrawerOpen: boolean;
    setIsDetailDrawerOpen: (isOpen: boolean) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
    isNewTaskModalOpen: false,
    setIsNewTaskModalOpen: (isOpen) => set({ isNewTaskModalOpen: isOpen }),
    selectedTaskId: null,
    setSelectedTaskId: (id) => set({ selectedTaskId: id }),
    isDetailDrawerOpen: false,
    setIsDetailDrawerOpen: (isOpen) => set({ isDetailDrawerOpen: isOpen }),
}));
