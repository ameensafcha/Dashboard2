'use client'

import { useRealtimeSync } from '@/hooks/useRealtimeSync'

export function RealtimeProvider({ children, businessId }: { children: React.ReactNode, businessId: string }) {
    // Use the global hook once to establish the WebSocket connection for all tables
    useRealtimeSync(businessId)
    return <>{children}</>
}
