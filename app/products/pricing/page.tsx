import { Suspense } from 'react';
import { getPricingTiers, getCategoriesForPricing } from '@/app/actions/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { PricingPageContent } from './PricingPageContent';

export const metadata = {
  title: 'Pricing Tiers - Safcha Dashboard',
  description: 'Manage pricing tiers for products',
};

export default async function PricingPage() {
  const [tiers, categories] = await Promise.all([
    getPricingTiers(),
    getCategoriesForPricing()
  ]);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Pricing Tiers" />

      <Suspense fallback={<div>Loading...</div>}>
        <PricingPageContent categories={categories} initialTiers={tiers} />
      </Suspense>
    </div>
  );
}
