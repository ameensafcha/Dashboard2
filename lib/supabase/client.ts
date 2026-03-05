import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern — ek hi instance, baar baar nahi banta
let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
    if (!client) {
        client = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }
    return client
}
