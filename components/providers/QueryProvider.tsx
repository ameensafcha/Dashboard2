'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 10_000,         // Data fresh for 10s
                refetchInterval: 30_000,    // Poll every 30s as realtime fallback
                refetchOnWindowFocus: true,  // Refetch on tab switch
                retry: 2,
                refetchIntervalInBackground: false, // Don't poll when tab is hidden
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
