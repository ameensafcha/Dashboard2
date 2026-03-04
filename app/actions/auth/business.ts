'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { MODULES_CONFIG } from '@/lib/permissions-config'
import { redirect } from 'next/navigation'

export async function createBusinessWithOwner(data: {
    name: string
    industry: string
    currency: string
    timezone: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Slugify name roughly
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4)

    const business = await prisma.$transaction(async (tx: any) => {
        // 1. Create Business
        const newBusiness = await tx.business.create({
            data: {
                name: data.name,
                slug,
                industry: data.industry,
                currency: data.currency,
                timezone: data.timezone,
            }
        })

        // 2. Create OWNER Role
        const ownerRole = await tx.role.create({
            data: {
                businessId: newBusiness.id,
                name: 'OWNER',
                isSystem: true,
                color: '#C9A84C'
            }
        })

        // 3. Create all permissions for OWNER
        const allPerms = []
        for (const mod of MODULES_CONFIG) {
            for (const action of mod.actions) {
                allPerms.push({ roleId: ownerRole.id, module: mod.key, action })
            }
        }
        await tx.rolePermission.createMany({ data: allPerms })

        // 4. Create BusinessUser
        await tx.businessUser.create({
            data: {
                businessId: newBusiness.id,
                userId: user.id,
                email: user.email || '',
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
                roleId: ownerRole.id,
                isActive: true,
            }
        })

        return newBusiness
    })

    // Set active business cookie
    const cookieStore = await cookies()
    cookieStore.set('active-business-id', business.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })

    return { success: true, businessId: business.id }
}

export async function selectBusiness(businessId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify access
    const membership = await prisma.businessUser.findUnique({
        where: { businessId_userId: { businessId, userId: user.id } }
    })

    if (!membership || !membership.isActive) {
        throw new Error('Access Denied')
    }

    // Update last seen
    await prisma.businessUser.update({
        where: { businessId_userId: { businessId, userId: user.id } },
        data: { lastSeenAt: new Date() }
    })

    const cookieStore = await cookies()
    cookieStore.set('active-business-id', businessId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })

    redirect('/')
}
