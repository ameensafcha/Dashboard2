import { create } from 'zustand';

export interface RawMaterialData {
    id: string;
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    unitCost: number;
    reorderThreshold: number | null;
    reorderQuantity: number | null;
    location: string;
    lastRestocked: Date | null;
    expiryDate: Date | null;
    supplierId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface InventoryState {
    rawMaterials: RawMaterialData[];
    isLoading: boolean;
    isMaterialDrawerOpen: boolean;
    selectedMaterialId: string | null;

    setRawMaterials: (materials: RawMaterialData[]) => void;
    setIsLoading: (loading: boolean) => void;
    openMaterialDrawer: (id: string | null) => void;
    closeMaterialDrawer: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
    rawMaterials: [],
    isLoading: true,
    isMaterialDrawerOpen: false,
    selectedMaterialId: null,

    setRawMaterials: (materials) => set({ rawMaterials: materials }),
    setIsLoading: (loading) => set({ isLoading: loading }),
    openMaterialDrawer: (id) => set({ isMaterialDrawerOpen: true, selectedMaterialId: id }),
    closeMaterialDrawer: () => set({ isMaterialDrawerOpen: false, selectedMaterialId: null }),
}));
