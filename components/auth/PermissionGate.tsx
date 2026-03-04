'use client'

import { usePermissions } from '@/lib/hooks/usePermissions'
import { ReactNode } from 'react'

interface PermissionGateProps {
    module: string
    action: string
    children: ReactNode
    fallback?: ReactNode
}

export function PermissionGate({
    module,
    action,
    children,
    fallback = null,
}: PermissionGateProps) {
    const { can } = usePermissions()

    if (can(module, action)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
