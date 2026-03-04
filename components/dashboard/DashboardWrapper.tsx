'use client';

import { useTranslation } from '@/lib/i18n';

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
    const { isRTL } = useTranslation();
    return (
        <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            {children}
        </div>
    );
}
