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
    updatedAt: Date;
    deletedAt?: Date | string | null;
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
    deletedAt?: Date | string | null;
    company?: {
        id: string;
        name: string;
        industry: string | null;
    } | null;
    _count?: {
        deals: number;
    }
};

export type DealStageType = 'new_lead' | 'qualified' | 'sample_sent' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export type Deal = {
    id: string;
    title: string;
    value: number;
    stage: DealStageType;
    expectedCloseDate: Date | null;
    priority: string;
    clientId: string | null;
    companyId: string | null;
    notes: string | null;
    createdAt: Date;
    company?: {
        id: string;
        name: string;
    } | null;
    client?: {
        id: string;
        name: string;
    } | null;
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
    upsertCompany: (company: Company) => void;
    removeCompany: (companyId: string) => void;
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
    upsertContact: (contact: Contact) => void;
    removeContact: (contactId: string) => void;
    setIsNewContactModalOpen: (isOpen: boolean) => void;
    setIsContactDrawerOpen: (isOpen: boolean) => void;
    setSelectedContact: (contact: Contact | null) => void;

    // Deals Pipeline
    deals: Deal[];
    isNewDealModalOpen: boolean;
    isDealDrawerOpen: boolean;
    selectedDeal: Deal | null;

    setDeals: (deals: Deal[]) => void;
    setIsNewDealModalOpen: (isOpen: boolean) => void;
    setIsDealDrawerOpen: (isOpen: boolean) => void;
    setSelectedDeal: (deal: Deal | null) => void;
    moveDealOptimistic: (dealId: string, newStage: DealStageType) => void;
}

export const useCrmStore = create<CrmStore>((set) => ({
    companies: [],
    activeTiers: [],
    activeCategories: [],
    isNewCompanyModalOpen: false,
    isCompanyDrawerOpen: false,
    selectedCompany: null,

    setCompanies: (companies) => set({
        companies: Array.from(new Map(companies.map(c => [c.id, c])).values())
    }),
    upsertCompany: (company) => set((state) => {
        // If it's a soft delete or has a deleted timestamp, remove it
        if (company.deletedAt || (company as any).deleted_at) {
            return { companies: state.companies.filter(c => c.id !== company.id) };
        }
        // Safety: Don't add a company if it's missing name (partial payload)
        if (!company.name) return state;

        const exists = state.companies.some(c => c.id === company.id);
        if (exists) {
            return {
                companies: state.companies.map(c => c.id === company.id ? { ...c, ...company } : c)
            };
        }
        return { companies: [company, ...state.companies] };
    }),
    removeCompany: (companyId) => set((state) => ({
        companies: state.companies.filter(c => c.id !== companyId)
    })),
    setActiveTiers: (tiers) => set({ activeTiers: tiers }),
    setActiveCategories: (categories) => set({ activeCategories: categories }),
    setIsNewCompanyModalOpen: (isOpen) => set({ isNewCompanyModalOpen: isOpen }),
    setIsCompanyDrawerOpen: (isOpen) => set({ isCompanyDrawerOpen: isOpen }),
    setSelectedCompany: (company) => set({ selectedCompany: company }),

    contacts: [],
    isNewContactModalOpen: false,
    isContactDrawerOpen: false,
    selectedContact: null,

    setContacts: (contacts) => set({
        contacts: Array.from(new Map(contacts.map(c => [c.id, c])).values())
    }),
    upsertContact: (contact) => set((state) => {
        // If it's a soft delete or has a deleted timestamp, remove it
        if (contact.deletedAt || (contact as any).deleted_at) {
            return { contacts: state.contacts.filter(c => c.id !== contact.id) };
        }
        // Safety: Don't add a contact if it's missing name (partial payload)
        if (!contact.name) return state;

        const exists = state.contacts.some(c => c.id === contact.id);
        if (exists) {
            return {
                contacts: state.contacts.map(c => c.id === contact.id ? { ...c, ...contact } : c)
            };
        }
        return { contacts: [contact, ...state.contacts] };
    }),
    removeContact: (contactId) => set((state) => ({
        contacts: state.contacts.filter(c => c.id !== contactId)
    })),
    setIsNewContactModalOpen: (isOpen) => set({ isNewContactModalOpen: isOpen }),
    setIsContactDrawerOpen: (isOpen) => set({ isContactDrawerOpen: isOpen }),
    setSelectedContact: (contact) => set({ selectedContact: contact }),

    deals: [],
    isNewDealModalOpen: false,
    isDealDrawerOpen: false,
    selectedDeal: null,

    setDeals: (deals) => set({ deals }),
    setIsNewDealModalOpen: (isOpen) => set({ isNewDealModalOpen: isOpen }),
    setIsDealDrawerOpen: (isOpen) => set({ isDealDrawerOpen: isOpen }),
    setSelectedDeal: (deal) => set({ selectedDeal: deal }),
    moveDealOptimistic: (dealId, newStage) => set((state) => ({
        deals: state.deals.map(d => d.id === dealId ? { ...d, stage: newStage } : d)
    })),
}));
