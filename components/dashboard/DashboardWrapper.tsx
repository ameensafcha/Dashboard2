'use client';

import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { revalidateDashboard } from '@/app/actions/dashboard';

interface DashboardWrapperProps {
    children: React.ReactNode;
    businessId?: string;
}

export default function DashboardWrapper({ children, businessId }: DashboardWrapperProps) {
    const { isRTL } = useTranslation();
    const router = useRouter();

    // Refresh everything on the dashboard when key tables change
    const onSync = async () => {
        console.log('Realtime Refreshing Dashboard...');
        try {
            await revalidateDashboard();
        } catch (e) {
            console.error('Failed to revalidate dashboard:', e);
        }
        router.refresh();
    };


    useRealtimeSync({ table: 'clients', businessId: businessId || '', onInsert: onSync, onDelete: onSync, onUpdate: onSync, enabled: !!businessId });
    useRealtimeSync({ table: 'companies', businessId: businessId || '', onInsert: onSync, onDelete: onSync, onUpdate: onSync, enabled: !!businessId });
    useRealtimeSync({ table: 'orders', businessId: businessId || '', onInsert: onSync, onDelete: onSync, onUpdate: onSync, enabled: !!businessId });
    useRealtimeSync({ table: 'transactions', businessId: businessId || '', onInsert: onSync, onDelete: onSync, onUpdate: onSync, enabled: !!businessId });

    return (
        <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            {children}
        </div>
    );
}
