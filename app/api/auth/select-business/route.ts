import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('id')

    if (!businessId) {
        return NextResponse.redirect(new URL('/select-business', request.nextUrl.origin))
    }

    // Create supabase client to verify user
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set() { },
                remove() { },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.nextUrl.origin))
    }

    // Verify membership and get business slug
    const membership = await prisma.businessUser.findUnique({
        where: { businessId_userId: { businessId, userId: user.id } },
        include: { business: { select: { slug: true } } }
    })

    if (!membership || !membership.isActive) {
        return NextResponse.redirect(new URL('/select-business', request.nextUrl.origin))
    }

    // Update last seen
    await prisma.businessUser.update({
        where: { businessId_userId: { businessId, userId: user.id } },
        data: { lastSeenAt: new Date() }
    })

    // Set the cookie and redirect to the business slug dashboard
    const redirectUrl = new URL(`/${membership.business.slug}`, request.nextUrl.origin)
    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set('active-business-id', businessId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })

    return response
}
