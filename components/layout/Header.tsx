'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Globe, Moon, Sun, Menu, ArrowRight, Loader2, Info, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/lib/i18n';
import { performGlobalSearch, SearchResult } from '@/app/actions/globalSearch';
import { SoftwareFlowDialog } from './SoftwareFlowDialog';
import { logoutUser } from '@/app/actions/auth/session';

export default function Header() {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
  } = useAppStore();

  const { t, isRTL } = useTranslation();

  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Extract businessSlug using usePathname() — works during SSR + CSR
  const businessSlug = pathname.split('/')[1] || 'safcha';

  const baseSearchModules = [
    { name: t.dashboard, href: '' },
    { name: t.salesOrders, href: '/sales' },
    { name: t.inventory, href: '/inventory' },
    { name: t.productionOverview, href: '/production' },
    { name: t.productionBatches, href: '/production/batches' },
    { name: t.qualityControl, href: '/production/quality' },
    { name: t.rnd, href: '/production/rnd' },
    { name: t.productsDashboard, href: '/products' },
    { name: t.categories, href: '/products/categories' },
    { name: t.pricing, href: '/products/pricing' },
    { name: t.financeOverview || t.finance, href: '/finance' },
    { name: t.crm, href: '/crm' },
    { name: t.settings, href: '/settings' },
  ];

  const searchModules = baseSearchModules.map(m => ({
    ...m,
    href: `/${businessSlug}${m.href}`
  }));

  const filteredModules = searchModules.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
        {/* Workflow Info */}
        <SoftwareFlowDialog>
          <button
            className="p-2 rounded-lg transition-colors flex items-center gap-1.5"
            style={{ color: 'var(--text-secondary)' }}
            title="How it works"
          >
            <Info className="w-5 h-5" />
            <span className="text-xs font-semibold hidden md:inline">Flow</span>
          </button>
        </SoftwareFlowDialog>

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

        {/* User Menu with Logout */}
        <UserMenuDropdown />
      </div>
    </header>
  );
}

function UserMenuDropdown() {
  const { user, setUser } = useAppStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    router.push('/login');
  };

  const initial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
          style={{ background: 'var(--accent-gold)', color: 'var(--accent-gold-foreground)' }}
        >
          {initial}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl overflow-hidden z-50"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {user?.name || 'User'}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {user?.email || ''}
            </p>
            <p className="text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-md inline-block" style={{ background: 'var(--accent-gold)', color: 'black' }}>
              {user?.role?.name || 'No Role'}
            </p>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push('/select-business'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              <UserIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              Switch Business
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-500/10 transition-colors text-red-500"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
