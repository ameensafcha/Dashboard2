'use client';

import { useProductStore } from '@/stores/productStore';
import { useAppStore } from '@/stores/appStore';
import { Search, X, Filter } from 'lucide-react';
import { productStatuses } from '@/app/actions/product/types';

export default function ProductFilters() {
  const { filters, setFilters, resetFilters } = useProductStore();
  const { isRTL } = useAppStore();

  const hasFilters = filters.search || filters.status;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
        <input
          type="text"
          placeholder={isRTL ? 'بحث...' : 'Search products...'}
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className={`w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A838] focus:border-transparent ${
            isRTL ? 'pr-10 pl-4' : 'pl-10 pr-10'
          }`}
        />
        {filters.search && (
          <button
            onClick={() => setFilters({ search: '' })}
            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'}`}
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      <select
        value={filters.status}
        onChange={(e) => setFilters({ status: e.target.value })}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A838] bg-white min-w-[150px]"
      >
        <option value="">{isRTL ? 'كل الحالات' : 'All Status'}</option>
        {productStatuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 px-3 py-2 text-sm text-[#D32F2F] hover:bg-red-50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          {isRTL ? 'مسح' : 'Clear'}
        </button>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Filter className="w-4 h-4" />
        <span>
          {hasFilters ? (isRTL ? 'مُفعّل' : 'Active filters') : (isRTL ? 'لا فلتر' : 'No filters')}
        </span>
      </div>
    </div>
  );
}
