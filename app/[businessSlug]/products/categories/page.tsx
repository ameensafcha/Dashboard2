import { Suspense } from 'react';
import { CategoriesClient } from './CategoriesClient';


export const metadata = {
  title: 'Categories - Safcha Dashboard',
  description: 'Manage product categories',
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading Categories...</div>}>
      <CategoriesClient />
    </Suspense>
  );
}
