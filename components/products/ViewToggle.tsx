'use client';

import { useProductStore } from '@/stores/productStore';
import { List, Grid3X3 } from 'lucide-react';

export default function ViewToggle() {
  const { viewMode, setViewMode } = useProductStore();

  return (
    <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <button
        onClick={() => setViewMode('list')}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
          viewMode === 'list'
            ? 'bg-[#E8A838] text-black'
            : ''
        }`}
        style={{
          background: viewMode === 'list' ? 'var(--accent-gold)' : 'var(--card)',
          color: viewMode === 'list' ? 'var(--accent-gold-foreground)' : 'var(--foreground)'
        }}
      >
        <List className="w-4 h-4" />
        List
      </button>
      <button
        onClick={() => setViewMode('grid')}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
          viewMode === 'grid'
            ? 'bg-[#E8A838] text-black'
            : ''
        }`}
        style={{
          background: viewMode === 'grid' ? 'var(--accent-gold)' : 'var(--card)',
          color: viewMode === 'grid' ? 'var(--accent-gold-foreground)' : 'var(--foreground)'
        }}
      >
        <Grid3X3 className="w-4 h-4" />
        Grid
      </button>
    </div>
  );
}
