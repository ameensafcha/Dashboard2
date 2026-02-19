'use server';

export interface PricingTier {
  id: string;
  productId: string | null;
  tierName: string;
  minOrderKg: number;
  pricePerKg: number;
  discountPercent: number;
  marginPercent: number;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

const mockPricingTiers: PricingTier[] = [
  {
    id: '1',
    productId: null,
    tierName: 'Silver',
    minOrderKg: 10,
    pricePerKg: 40,
    discountPercent: 10,
    marginPercent: 30,
    isGlobal: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    productId: null,
    tierName: 'Gold',
    minOrderKg: 50,
    pricePerKg: 35,
    discountPercent: 20,
    marginPercent: 40,
    isGlobal: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '3',
    productId: null,
    tierName: 'Platinum',
    minOrderKg: 100,
    pricePerKg: 30,
    discountPercent: 30,
    marginPercent: 50,
    isGlobal: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

export async function getPricingTiers(): Promise<PricingTier[]> {
  return mockPricingTiers;
}

export async function createPricingTier(data: Omit<PricingTier, 'id' | 'createdAt' | 'updatedAt'>): Promise<PricingTier> {
  const newTier: PricingTier = {
    ...data,
    id: String(mockPricingTiers.length + 1),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockPricingTiers.push(newTier);
  return newTier;
}

export async function deletePricingTier(id: string): Promise<boolean> {
  const index = mockPricingTiers.findIndex(t => t.id === id);
  if (index === -1) return false;
  mockPricingTiers.splice(index, 1);
  return true;
}
