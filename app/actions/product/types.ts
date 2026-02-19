export type ProductStatus = 'active' | 'in_development' | 'discontinued';
export type SfdaStatus = 'approved' | 'pending' | 'not_submitted';

export interface ProductCategoryType {
  id: string;
  name: string;
  description: string | null;
}

export const productStatuses: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'in_development', label: 'In Development' },
  { value: 'discontinued', label: 'Discontinued' },
];

export const sfdaStatuses: { value: SfdaStatus; label: string }[] = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'not_submitted', label: 'Not Submitted' },
];
