import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { cache } from 'react'

async function getBusinessContextInternal(slug?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('UNAUTHORIZED')

    let businessId: string | undefined;

    if (slug) {
        // Resolve businessId from slug
        const business = await prisma.business.findUnique({
            where: { slug },
            select: { id: true }
        });
        if (!business) throw new Error('BUSINESS_NOT_FOUND');
        businessId = business.id;
    } else {
        // Fallback to cookie
        const cookieStore = await cookies()
        businessId = cookieStore.get('active-business-id')?.value
    }

    if (!businessId) throw new Error('NO_BUSINESS_SELECTED')

    const businessUser = await prisma.businessUser.findUnique({
        where: { businessId_userId: { businessId, userId: user.id } },
        include: {
            role: { include: { permissions: true } },
            business: { select: { name: true, currency: true, slug: true } }
        }
    })

    if (!businessUser) throw new Error('ACCESS_DENIED')
    if (!businessUser.isActive) throw new Error('ACCESS_REVOKED')

    return {
        userId: user.id,
        userName: businessUser.name,
        businessId,
        businessName: businessUser.business.name,
        businessSlug: businessUser.business.slug,
        role: businessUser.role,
    }
}

export const getBusinessContext = cache(getBusinessContextInternal)

