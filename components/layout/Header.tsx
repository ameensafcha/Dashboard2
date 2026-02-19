'use client';

import { useState } from 'react';
import { Search, Globe, ChevronDown, Moon, Sun, Menu, X } from 'lucide-react';
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
      <div className="flex-1 max-w-md mx-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t.search}
            className="w-full sm:w-64 lg:w-80 pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              background: 'var(--muted)', 
              border: '1px solid var(--border)',
              color: 'var(--foreground)'
            }}
          />
        </div>
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
