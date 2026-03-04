'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function getSessionUser() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const cookieStore = await cookies()
        const businessId = cookieStore.get('active-business-id')?.value
        if (!businessId) return null

        const businessUser = await prisma.businessUser.findUnique({
            where: { businessId_userId: { businessId, userId: user.id } },
            include: {
                role: { include: { permissions: true } },
                business: { select: { name: true, currency: true } }
            }
        })

        if (!businessUser || !businessUser.isActive) return null

        return {
            id: user.id,
            name: businessUser.name,
            email: businessUser.email,
            avatar: businessUser.avatarUrl,
            role: {
                name: businessUser.role.name,
                isSystem: businessUser.role.isSystem,
                permissions: businessUser.role.permissions.map(p => ({
                    module: p.module,
                    action: p.action,
                })),
            },
            businessName: businessUser.business.name,
        }
    } catch {
        return null
    }
}

export async function logoutUser() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete('active-business-id')
}
