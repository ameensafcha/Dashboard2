import { create } from 'zustand';

interface DocumentsState {
    isUploadModalOpen: boolean;
    setIsUploadModalOpen: (isOpen: boolean) => void;
    // We could add file preview modal state here later
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
    isUploadModalOpen: false,
    setIsUploadModalOpen: (isOpen) => set({ isUploadModalOpen: isOpen }),
}));
