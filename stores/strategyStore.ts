import { create } from 'zustand';

interface StrategyState {
    isNewGoalModalOpen: boolean;
    setIsNewGoalModalOpen: (isOpen: boolean) => void;
    selectedGoalId: string | null;
    setSelectedGoalId: (id: string | null) => void;
    isDetailDrawerOpen: boolean;
    setIsDetailDrawerOpen: (isOpen: boolean) => void;
}

export const useStrategyStore = create<StrategyState>((set) => ({
    isNewGoalModalOpen: false,
    setIsNewGoalModalOpen: (isOpen) => set({ isNewGoalModalOpen: isOpen }),
    selectedGoalId: null,
    setSelectedGoalId: (id) => set({ selectedGoalId: id }),
    isDetailDrawerOpen: false,
    setIsDetailDrawerOpen: (isOpen) => set({ isDetailDrawerOpen: isOpen }),
}));
