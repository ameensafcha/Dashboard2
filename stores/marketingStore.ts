import { create } from 'zustand';

interface MarketingState {
    isNewCampaignModalOpen: boolean;
    setIsNewCampaignModalOpen: (isOpen: boolean) => void;
    selectedCampaignId: string | null;
    setSelectedCampaignId: (id: string | null) => void;
    isDetailDrawerOpen: boolean;
    setIsDetailDrawerOpen: (isOpen: boolean) => void;
}

export const useMarketingStore = create<MarketingState>((set) => ({
    isNewCampaignModalOpen: false,
    setIsNewCampaignModalOpen: (isOpen) => set({ isNewCampaignModalOpen: isOpen }),
    selectedCampaignId: null,
    setSelectedCampaignId: (id) => set({ selectedCampaignId: id }),
    isDetailDrawerOpen: false,
    setIsDetailDrawerOpen: (isOpen) => set({ isDetailDrawerOpen: isOpen }),
}));
