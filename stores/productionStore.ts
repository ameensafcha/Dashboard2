import { create } from 'zustand';

interface ProductionBatchForm {
  productId: string;
  targetQty: number;
  actualQty: number;
  status: string;
  startDate: string;
  endDate: string;
  qualityScore: number;
  producedBy: string;
  notes: string;
}

interface ProductionStore {
  batches: any[];
  products: any[];
  isModalOpen: boolean;
  selectedBatch: any | null;
  isDetailOpen: boolean;
  formData: ProductionBatchForm;
  isSaving: boolean;
  
  setBatches: (batches: any[]) => void;
  setProducts: (products: any[]) => void;
  setIsModalOpen: (open: boolean) => void;
  setSelectedBatch: (batch: any | null) => void;
  setIsDetailOpen: (open: boolean) => void;
  setFormData: (data: Partial<ProductionBatchForm>) => void;
  resetForm: () => void;
  setIsSaving: (saving: boolean) => void;
}

const initialFormData: ProductionBatchForm = {
  productId: '',
  targetQty: 0,
  actualQty: 0,
  status: 'planned',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  qualityScore: 0,
  producedBy: '',
  notes: '',
};

export const useProductionStore = create<ProductionStore>((set) => ({
  batches: [],
  products: [],
  isModalOpen: false,
  selectedBatch: null,
  isDetailOpen: false,
  formData: initialFormData,
  isSaving: false,
  
  setBatches: (batches) => set({ batches }),
  setProducts: (products) => set({ products }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setSelectedBatch: (selectedBatch) => set({ selectedBatch }),
  setIsDetailOpen: (isDetailOpen) => set({ isDetailOpen }),
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () => set({ formData: initialFormData }),
  setIsSaving: (isSaving) => set({ isSaving }),
}));
