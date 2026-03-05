'use client';

import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

interface DashboardWrapperProps {
    children: React.ReactNode;
    businessId?: string;
}

export default function DashboardWrapper({ children, businessId }: DashboardWrapperProps) {
    const { isRTL } = useTranslation();
    const router = useRouter();

    // Realtime Sync is now handled globally via RealtimeProvider in layout.tsx
    // The master hook in RealtimeProvider handles updates to stores.

    return (
        <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            {children}
        </div>
    );
}
