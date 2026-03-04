'use client';

import React from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface PermissionGuardProps {
    module: string;
    action: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    mode?: 'hide' | 'lock';
}

/**
 * PermissionGuard
 * 
 * A wrapper component to protect UI elements based on user permissions.
 * 
 * @param module - The module name (e.g., 'sales', 'inventory')
 * @param action - The action type (e.g., 'view', 'create', 'edit', 'delete')
 * @param mode - 'hide' (default) removes from DOM, 'lock' renders fallback or null
 */
export function PermissionGuard({
    module,
    action,
    children,
    fallback = null,
    mode = 'hide',
}: PermissionGuardProps) {
    const { can } = usePermissions();
    const hasAccess = can(module, action);

    if (hasAccess) {
        return <>{children}</>;
    }

    if (mode === 'hide') {
        return null;
    }

    return <>{fallback}</>;
}
