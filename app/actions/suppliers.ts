'use server';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Herb Exports Co.',
    contactPerson: 'Ahmed Hassan',
    email: 'ahmed@herbexports.com',
    phone: '+966 50 123 4567',
    address: 'Riyadh, Saudi Arabia',
    notes: 'Primary supplier for base powders',
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Spice Masters',
    contactPerson: 'Khalid Ibrahim',
    email: 'khalid@spicemasters.com',
    phone: '+966 55 987 6543',
    address: 'Jeddah, Saudi Arabia',
    notes: 'Premium spice supplier',
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'Pack Solutions',
    contactPerson: 'Fahad Alotaibi',
    email: 'fahad@packsol.com',
    phone: '+966 56 111 2222',
    address: 'Dammam, Saudi Arabia',
    notes: 'Packaging materials',
    isActive: true,
    createdAt: '2024-02-01',
  },
];

export async function getSuppliers(): Promise<Supplier[]> {
  return mockSuppliers;
}

export async function createSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
  const newSupplier: Supplier = {
    ...data,
    id: String(mockSuppliers.length + 1),
    createdAt: new Date().toISOString(),
  };
  mockSuppliers.push(newSupplier);
  return newSupplier;
}

export async function deleteSupplier(id: string): Promise<boolean> {
  const index = mockSuppliers.findIndex(s => s.id === id);
  if (index === -1) return false;
  mockSuppliers.splice(index, 1);
  return true;
}
