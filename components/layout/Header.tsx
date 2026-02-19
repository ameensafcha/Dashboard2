'use client';

import { Search, Globe, ChevronDown, Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

const translations = {
  en: {
    dashboard: 'Dashboard',
    search: 'Search...',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    search: 'بحث...',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
  },
};

export default function Header() {
  const { 
    language, 
    setLanguage, 
    theme, 
    toggleTheme,
    isRTL,
  } = useAppStore();
  
  const t = translations[language];

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <header 
      className="flex items-center justify-between h-16 px-4 sm:px-6"
      style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{t.dashboard}</h2>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t.search}
            className="w-48 lg:w-64 pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              background: 'var(--muted)', 
              border: '1px solid var(--border)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title={theme === 'light' ? t.darkMode : t.lightMode}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Language Toggle - Shows the language you can SWITCH TO */}
        <button 
          onClick={handleLanguageToggle}
          className="flex items-center px-2 sm:px-3 py-2 text-sm rounded-lg font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Globe className="w-4 h-4" style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }} />
          <span>{language === 'en' ? 'عربي' : 'EN'}</span>
        </button>

        {/* User Menu */}
        <button 
          className="flex items-center"
          style={{ 
            paddingLeft: isRTL ? 0 : 12, 
            borderLeft: isRTL ? 0 : '1px solid var(--border)',
            paddingRight: isRTL ? 12 : 0,
            borderRight: isRTL ? '1px solid var(--border)' : 0
          }}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center font-medium"
            style={{ background: 'var(--accent-gold)', color: 'var(--accent-gold-foreground)' }}
          >
            A
          </div>
          <ChevronDown 
            className="w-4 h-4" 
            style={{ marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0, color: 'var(--text-muted)' }} 
          />
        </button>
      </div>
    </header>
  );
}
