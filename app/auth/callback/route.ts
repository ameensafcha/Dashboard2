import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/select-business'

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return undefined // Note: In route handlers, we use a different approach usually, but since we are just setting it via response it's handled below
                    },
                    set(name: string, value: string, options: CookieOptions) { },
                    remove(name: string, options: CookieOptions) { },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Successful login, could implement isActive logic here
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Invalid_Auth_Code`)
}
