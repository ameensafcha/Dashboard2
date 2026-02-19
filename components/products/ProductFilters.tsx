'use client';

import { useProductStore } from '@/stores/productStore';
import { useAppStore } from '@/stores/appStore';
import { Search, X, Filter } from 'lucide-react';
import { productStatuses } from '@/app/actions/product/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProductFilters() {
  const { filters, setFilters, resetFilters } = useProductStore();
  const { isRTL } = useAppStore();

  const hasFilters = filters.search || filters.status;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder={isRTL ? 'بحث...' : 'Search products...'}
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className={`w-full pl-10 pr-10 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A838] focus:border-transparent ${
            isRTL ? 'pr-10 pl-4' : 'pl-10 pr-10'
          }`}
          style={{ 
            background: 'var(--muted)', 
            border: '1px solid var(--border)',
            color: 'var(--foreground)'
          }}
        />
        {filters.search && (
          <button
            onClick={() => setFilters({ search: '' })}
            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'}`}
          >
            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>

      <Select value={filters.status || "all"} onValueChange={(value) => setFilters({ status: value === "all" ? "" : value })}>
        <SelectTrigger className="w-[150px]" style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
          <SelectValue placeholder={isRTL ? 'كل الحالات' : 'All Status'} />
        </SelectTrigger>
        <SelectContent style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <SelectItem value="all">{isRTL ? 'كل الحالات' : 'All Status'}</SelectItem>
          {productStatuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors"
          style={{ color: 'var(--error)' }}
        >
          <X className="w-4 h-4" />
          {isRTL ? 'مسح' : 'Clear'}
        </button>
      )}

      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        <Filter className="w-4 h-4" />
        <span>
          {hasFilters ? (isRTL ? 'مُفعّل' : 'Active filters') : (isRTL ? 'لا فلتر' : 'No filters')}
        </span>
      </div>
    </div>
  );
}
