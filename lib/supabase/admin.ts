import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// IMPORTANT: Never use this client on the browser/client-side!
// It bypasses Row Level Security (RLS).
export const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)
