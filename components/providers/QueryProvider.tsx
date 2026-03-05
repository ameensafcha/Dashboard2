'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 10_000,         // Data fresh for 10s
                refetchInterval: 30_000,    // Poll every 30s as realtime fallback
                refetchOnWindowFocus: true,  // Refetch on tab switch
                retry: 2,
                refetchIntervalInBackground: false, // Don't poll when tab is hidden
            },
        },
    })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always make a new query client
        return makeQueryClient()
    } else {
        // Browser: make a new query client if we don't already have one
        // This is very important so we don't re-make a new client if React
        // suspends during the initial render. This may not be needed if we
        // have a query client provider higher up in the tree.
        if (!browserQueryClient) browserQueryClient = makeQueryClient()
        return browserQueryClient
    }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    // NOTE: Avoid useState when initializing the query client if you want
    // to use it in a singleton pattern across the browser.
    const queryClient = getQueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
