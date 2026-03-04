'use client'

import { useAppStore } from '@/stores/appStore'

export function usePermissions() {
    const { user } = useAppStore()

    const can = (module: string, action: string): boolean => {
        if (!user) return false

        // 1. System ADMIN bypass (any role with isSystem=true)
        if (user.role.isSystem) {
            return true
        }

        // 2. Check Role Permissions
        const rolePerm = user.role.permissions.find(
            (p: any) => p.module === module && p.action === action
        )

        return !!rolePerm
    }

    return { can }
}
