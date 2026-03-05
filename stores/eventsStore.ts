import { create } from 'zustand';

interface EventsState {
    isNewEventModalOpen: boolean;
    setIsNewEventModalOpen: (isOpen: boolean) => void;
    selectedEventId: string | null;
    setSelectedEventId: (id: string | null) => void;
    isDetailDrawerOpen: boolean;
    setIsDetailDrawerOpen: (isOpen: boolean) => void;
}

export const useEventsStore = create<EventsState>((set) => ({
    isNewEventModalOpen: false,
    setIsNewEventModalOpen: (isOpen) => set({ isNewEventModalOpen: isOpen }),
    selectedEventId: null,
    setSelectedEventId: (id) => set({ selectedEventId: id }),
    isDetailDrawerOpen: false,
    setIsDetailDrawerOpen: (isOpen) => set({ isDetailDrawerOpen: isOpen }),
}));
