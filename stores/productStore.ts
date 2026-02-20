import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProductFilters {
  search: string;
  status: string;
}

interface ProductState {
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;

  filters: ProductFilters;
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;

  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  selectedProduct: string | null;
  setSelectedProduct: (id: string | null) => void;

  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;

  isDeleteModalOpen: boolean;
  setDeleteModalOpen: (open: boolean) => void;

  productToDelete: string | null;
  setProductToDelete: (id: string | null) => void;
}

const defaultFilters: ProductFilters = {
  search: '',
  status: '',
};

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      viewMode: 'list',
      setViewMode: (viewMode) => set({ viewMode }),

      filters: defaultFilters,
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      resetFilters: () => set({ filters: defaultFilters }),

      isLoading: false,
      setLoading: (isLoading) => set({ isLoading }),

      selectedProduct: null,
      setSelectedProduct: (selectedProduct) => set({ selectedProduct }),

      isModalOpen: false,
      setModalOpen: (isModalOpen) => set({ isModalOpen }),

      isDeleteModalOpen: false,
      setDeleteModalOpen: (isDeleteModalOpen) => set({ isDeleteModalOpen }),

      productToDelete: null,
      setProductToDelete: (productToDelete) => set({ productToDelete }),

    }),
    {
      name: 'product-storage',
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    }
  )
);
