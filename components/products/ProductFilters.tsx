'use client';

import { useProductStore } from '@/stores/productStore';
import { useTranslation } from '@/lib/i18n';
import { Search, X, Filter } from 'lucide-react';
import { productStatuses } from '@/app/actions/product/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProductFilters() {
  const { filters, setFilters, resetFilters } = useProductStore();
  const { t, isRTL } = useTranslation();

  const hasFilters = filters.search || filters.status;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder={t.searchProducts || 'Search products...'}
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className={`w-full py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A838] focus:border-transparent placeholder:text-[var(--text-secondary)] ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'
            }`}
          style={{
            background: 'var(--muted)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)'
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
        <SelectTrigger className="w-[160px] h-10 shadow-sm border-[var(--border)]" style={{ background: 'var(--muted)', color: 'var(--text-primary)' }}>
          <SelectValue placeholder={t.allStatus || 'All Statuses'} />
        </SelectTrigger>
        <SelectContent className="bg-[var(--card)] border-[var(--border)] min-w-[160px] z-[60] shadow-xl">
          <SelectItem
            value="all"
            className="focus:bg-[#E8A838] focus:text-black text-[var(--text-primary)] cursor-pointer py-2.5"
          >
            {t.allStatus || 'All Statuses'}
          </SelectItem>
          {productStatuses.map((status) => (
            <SelectItem
              key={status.value}
              value={status.value}
              className="focus:bg-[#E8A838] focus:text-black text-[var(--text-primary)] cursor-pointer py-2.5"
            >
              {t[status.value as keyof typeof t] || status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--error)]/10"
          style={{ color: 'var(--error)' }}
        >
          <X className="w-4 h-4" />
          {t.clear || 'Clear'}
        </button>
      )}

      <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]" style={{ color: 'var(--text-secondary)' }}>
        <Filter className="w-4 h-4 opacity-70" />
        <span className="font-medium text-[var(--text-primary)]">
          {hasFilters ? (t.activeFilters || 'Active filters') : (t.noFilters || 'No filters')}
        </span>
      </div>
    </div>
  );
}
