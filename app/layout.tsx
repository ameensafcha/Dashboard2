'use client';

import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/stores/appStore';
import { ToastContainer } from '@/components/ui/toast';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, isRTL, language } = useAppStore();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('data-theme', theme);
  }, [language, isRTL, theme]);

  return (
    <html lang={language} dir={isRTL ? 'rtl' : 'ltr'} data-theme={theme}>
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ background: 'var(--background)' }}>
              <div className="max-w-[1400px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
