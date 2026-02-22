'use client';

import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/stores/appStore';
import { ToastContainer } from '@/components/ui/toast';

export default function RootClientLayout({
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
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ background: 'var(--background)' }}>
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
            <ToastContainer />
        </div>
    );
}
