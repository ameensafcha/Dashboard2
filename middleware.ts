import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    supabaseResponse = NextResponse.next({ request: { headers: request.headers } })
                    supabaseResponse.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    supabaseResponse = NextResponse.next({ request: { headers: request.headers } })
                    supabaseResponse.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Routes that don't require auth
    const publicRoutes = ['/login', '/auth', '/select-business', '/api']
    const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith(r + '/') || pathname === r)

    // If not logged in and not on a public route → redirect to login
    if (!user && !isPublic) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If logged in and on login page → redirect to /select-business
    if (user && pathname === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/select-business'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
