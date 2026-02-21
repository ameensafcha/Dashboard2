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

export type Contact = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    companyId: string | null;
    role: string | null;
    type: string;
    source: string;
    tags: string[];
    city: string | null;
    notes: string | null;
    createdAt: Date;
    company?: {
        id: string;
        name: string;
        industry: string | null;
    } | null;
    _count?: {
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

    // Contacts
    contacts: Contact[];
    isNewContactModalOpen: boolean;
    isContactDrawerOpen: boolean;
    selectedContact: Contact | null;

    setContacts: (contacts: Contact[]) => void;
    setIsNewContactModalOpen: (isOpen: boolean) => void;
    setIsContactDrawerOpen: (isOpen: boolean) => void;
    setSelectedContact: (contact: Contact | null) => void;
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

    contacts: [],
    isNewContactModalOpen: false,
    isContactDrawerOpen: false,
    selectedContact: null,

    setContacts: (contacts) => set({ contacts }),
    setIsNewContactModalOpen: (isOpen) => set({ isNewContactModalOpen: isOpen }),
    setIsContactDrawerOpen: (isOpen) => set({ isContactDrawerOpen: isOpen }),
    setSelectedContact: (contact) => set({ selectedContact: contact }),
}));
