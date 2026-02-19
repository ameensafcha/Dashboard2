'use client';

import { useProductStore } from '@/stores/productStore';
import { List, Grid3X3 } from 'lucide-react';

export default function ViewToggle() {
  const { viewMode, setViewMode } = useProductStore();

  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setViewMode('list')}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
          viewMode === 'list'
            ? 'bg-[#1A1A2E] text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <List className="w-4 h-4" />
        List
      </button>
      <button
        onClick={() => setViewMode('grid')}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
          viewMode === 'grid'
            ? 'bg-[#1A1A2E] text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <Grid3X3 className="w-4 h-4" />
        Grid
      </button>
    </div>
  );
}
