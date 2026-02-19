import { Suspense } from 'react';
import { getPricingTiers, PricingTier } from '@/app/actions/pricing';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata = {
  title: 'Pricing Tiers - Safcha Dashboard',
  description: 'Manage pricing tiers for products',
};

async function PricingList() {
  const tiers = await getPricingTiers();
  
  return (
    <div>
      {tiers.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-muted)' }}>No pricing tiers yet</p>
          <Button className="mt-4 bg-[#E8A838] hover:bg-[#d49a2d] text-black">
            <Plus className="w-4 h-4 mr-2" />
            Add Pricing Tier
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <table className="w-full">
            <thead className="" style={{ background: 'var(--muted)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Tier Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Min Order (kg)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Price/kg</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Discount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{tier.tierName}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{tier.minOrderKg}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>SAR {tier.pricePerKg}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{tier.discountPercent}%</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function PricingPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Pricing Tiers" />

      <div className="mb-4 flex justify-end">
        <Button className="bg-[#E8A838] hover:bg-[#d49a2d] text-black">
          <Plus className="w-4 h-4 mr-2" />
          Add Tier
        </Button>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <PricingList />
      </Suspense>
    </div>
  );
}
