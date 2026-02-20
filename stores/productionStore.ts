import { create } from 'zustand';
import { ProductionBatchWithProduct, RndProjectType } from '@/app/actions/production';

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
  batches: ProductionBatchWithProduct[];
  products: { id: string; name: string }[];
  isModalOpen: boolean;
  selectedBatch: ProductionBatchWithProduct | null;
  isDetailOpen: boolean;
  formData: ProductionBatchForm;
  isSaving: boolean;

  // R&D State
  rndProjects: RndProjectType[];
  isRnDModalOpen: boolean;
  selectedRnDProject: RndProjectType | null;

  // Batch detailed toggles
  isEditingBatch: boolean;
  isDeleteDialogOpen: boolean;

  setBatches: (batches: ProductionBatchWithProduct[]) => void;
  setProducts: (products: { id: string; name: string }[]) => void;
  setIsModalOpen: (open: boolean) => void;
  setSelectedBatch: (batch: ProductionBatchWithProduct | null) => void;
  setIsDetailOpen: (open: boolean) => void;
  setFormData: (data: Partial<ProductionBatchForm>) => void;
  resetForm: () => void;
  setIsSaving: (saving: boolean) => void;

  setRnDProjects: (projects: RndProjectType[]) => void;
  setIsRnDModalOpen: (open: boolean) => void;
  setSelectedRnDProject: (project: RndProjectType | null) => void;

  setIsEditingBatch: (editing: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
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

  rndProjects: [],
  isRnDModalOpen: false,
  selectedRnDProject: null,

  isEditingBatch: false,
  isDeleteDialogOpen: false,

  setBatches: (batches) => set({ batches }),
  setProducts: (products) => set({ products }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setSelectedBatch: (selectedBatch) => set({ selectedBatch }),
  setIsDetailOpen: (isDetailOpen) => set({ isDetailOpen }),
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () => set({ formData: initialFormData }),
  setIsSaving: (isSaving) => set({ isSaving }),

  setRnDProjects: (rndProjects) => set({ rndProjects }),
  setIsRnDModalOpen: (isRnDModalOpen) => set({ isRnDModalOpen }),
  setSelectedRnDProject: (selectedRnDProject) => set({ selectedRnDProject }),

  setIsEditingBatch: (isEditingBatch) => set({ isEditingBatch }),
  setIsDeleteDialogOpen: (isDeleteDialogOpen) => set({ isDeleteDialogOpen }),
}));
