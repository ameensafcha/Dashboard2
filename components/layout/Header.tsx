'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe, Moon, Sun, Menu, ArrowRight, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/lib/i18n';
import { performGlobalSearch, SearchResult } from '@/app/actions/globalSearch';

export default function Header() {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
  } = useAppStore();

  const { t, isRTL } = useTranslation();

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchModules = [
    { name: t.dashboard || 'Dashboard', href: '/' },
    { name: t.sales || 'Sales & Orders', href: '/sales' },
    { name: t.inventory || 'Inventory', href: '/inventory' },
    { name: t.productionOverview || 'Production Overview', href: '/production' },
    { name: t.productionBatches || 'Production Batches', href: '/production/batches' },
    { name: t.qualityControl || 'Quality Control', href: '/production/quality' },
    { name: t.rnd || 'R&D', href: '/production/rnd' },
    { name: t.productsDashboard || 'Products', href: '/products' },
    { name: t.allCategories || 'Categories', href: '/products/categories' },
    { name: t.pricing || 'Pricing Tiers', href: '/products/pricing' },
    { name: t.finance || 'Finance', href: '/finance' },
    { name: t.crm || 'CRM', href: '/crm' },
    { name: t.settings || 'Settings', href: '/settings' },
  ];

  const filteredModules = searchModules.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debounce search query to hit the database
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDbResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await performGlobalSearch(searchQuery);
        setDbResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <header
      className="flex items-center justify-between h-14 px-3 sm:px-6 flex-shrink-0"
      style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden p-2 rounded-lg"
        style={{ color: 'var(--foreground)' }}
        onClick={() => {
          const event = new CustomEvent('toggle-sidebar');
          window.dispatchEvent(event);
        }}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Search - visible on all screens */}
      <div className="flex-1 max-w-md mx-3 relative z-50">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            className="w-full sm:w-64 lg:w-80 ps-10 pe-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
            style={{
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery && (
          <div className="absolute top-full mt-2 w-full sm:w-80 lg:w-96 rounded-xl overflow-hidden shadow-xl border bg-[var(--card)] z-50 flex flex-col max-h-[70vh]" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-y-auto styled-scrollbar">

              {/* Navigation Matches */}
              {filteredModules.length > 0 && (
                <div className="py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Navigation</div>
                  {filteredModules.slice(0, 3).map((item) => (
                    <div
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="flex justify-between items-center px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-medium">{item.name}</span>
                      <ArrowRight className={`w-4 h-4 opacity-50 ${isRTL ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Database Results */}
              <div className="py-2">
                <div className="px-4 py-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <span>Database Matches</span>
                  {isSearching && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>

                {!isSearching && dbResults.length === 0 && (
                  <div className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                    No database records found for &quot;{searchQuery}&quot;
                  </div>
                )}

                {!isSearching && dbResults.length > 0 && (
                  dbResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => {
                        router.push(result.href);
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors border-b last:border-0"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-sm font-semibold truncate text-[var(--foreground)]">{result.title}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                            {result.type}
                          </span>
                          {result.subtitle && (
                            <span className="text-xs truncate text-[var(--text-secondary)]">{result.subtitle}</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 opacity-30 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title={theme === 'light' ? t.darkMode : t.lightMode}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Language Toggle */}
        <button
          onClick={handleLanguageToggle}
          className="flex items-center px-2 sm:px-3 py-2 text-sm rounded-lg font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Globe className="w-4 h-4" style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }} />
          <span className="hidden sm:inline">{language === 'en' ? 'عربي' : 'EN'}</span>
        </button>

        {/* User Menu */}
        <button
          className="flex items-center"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-medium"
            style={{ background: 'var(--accent-gold)', color: 'var(--accent-gold-foreground)' }}
          >
            A
          </div>
        </button>
      </div>
    </header>
  );
}
