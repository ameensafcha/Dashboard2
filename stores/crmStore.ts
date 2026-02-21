import { create } from 'zustand';

export type PricingTier = {
    id: string;
    tierName: string;
    minOrderKg: number;
    maxOrderKg: number;
    pricePerKg: number;
    discountPercent: number;
    marginPercent: number;
    categoryId?: string | null;
    isGlobal?: boolean;
};

export type CompanyPricingTier = {
    id: string;
    categoryId: string;
    categoryName: string;
    pricingTierId: string;
    tierName: string;
    pricePerKg: number;
    minOrderKg: number;
    marginPercent: number;
};

export type Category = {
    id: string;
    name: string;
};

export type Company = {
    id: string;
    name: string;
    industry: string | null;
    city: string | null;
    website: string | null;
    lifetimeValue: number;
    pricingTiers: CompanyPricingTier[];
    createdAt: Date;
    updatedAt: Date;
    _count?: {
        contacts: number;
        deals: number;
    }
};

interface CrmStore {
    // Companies
    companies: Company[];
    activeTiers: PricingTier[];
    activeCategories: Category[];
    isNewCompanyModalOpen: boolean;
    isCompanyDrawerOpen: boolean;
    selectedCompany: Company | null;

    setCompanies: (companies: Company[]) => void;
    setActiveTiers: (tiers: PricingTier[]) => void;
    setActiveCategories: (categories: Category[]) => void;
    setIsNewCompanyModalOpen: (isOpen: boolean) => void;
    setIsCompanyDrawerOpen: (isOpen: boolean) => void;
    setSelectedCompany: (company: Company | null) => void;
}

export const useCrmStore = create<CrmStore>((set) => ({
    companies: [],
    activeTiers: [],
    activeCategories: [],
    isNewCompanyModalOpen: false,
    isCompanyDrawerOpen: false,
    selectedCompany: null,

    setCompanies: (companies) => set({ companies }),
    setActiveTiers: (tiers) => set({ activeTiers: tiers }),
    setActiveCategories: (categories) => set({ activeCategories: categories }),
    setIsNewCompanyModalOpen: (isOpen) => set({ isNewCompanyModalOpen: isOpen }),
    setIsCompanyDrawerOpen: (isOpen) => set({ isCompanyDrawerOpen: isOpen }),
    setSelectedCompany: (company) => set({ selectedCompany: company }),
}));
