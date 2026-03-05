'use client'

import { useRealtimeSync } from '@/hooks/useRealtimeSync'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    // Use the global hook once to establish the WebSocket connection for all tables
    useRealtimeSync()
    return <>{children}</>
}
