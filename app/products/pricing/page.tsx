import { Suspense } from 'react';
import { getPricingTiers, PricingTier } from '@/app/actions/pricing';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          <p className="text-gray-500">No pricing tiers yet</p>
          <Button className="mt-4 bg-[#E8A838] hover:bg-[#d49a2d] text-black">
            <Plus className="w-4 h-4 mr-2" />
            Add Pricing Tier
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-50">
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
                <tr key={tier.id} className="border-t">
                  <td className="px-4 py-3">{tier.tierName}</td>
                  <td className="px-4 py-3">{tier.minOrderKg}</td>
                  <td className="px-4 py-3">SAR {tier.pricePerKg}</td>
                  <td className="px-4 py-3">{tier.discountPercent}%</td>
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
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Pricing Tiers</h1>
          <p className="text-gray-500 mt-1">Manage bulk pricing for wholesale customers</p>
        </div>
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
