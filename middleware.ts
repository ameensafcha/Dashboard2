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
        return NextResponse.redirect(new URL('/login', request.nextUrl.origin))
    }

    // If logged in and on login page → redirect to /select-business
    if (user && pathname === '/login') {
        return NextResponse.redirect(new URL('/select-business', request.nextUrl.origin))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes)
         * - static assets (svg, png, jpg, jpeg, gif, webp, ico)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
