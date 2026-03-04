import { Role, RolePermission } from '@prisma/client'

type PermissionContext = {
    role: Role & { permissions: RolePermission[] }
}

export function hasPermission(
    ctx: PermissionContext,
    module: string,
    action: string
): boolean {
    // 1. Any system role (ADMIN, etc.) bypasses all checks
    if (ctx.role.isSystem) {
        return true
    }

    // 2. Check Role Permissions
    const rolePerm = ctx.role.permissions.find(
        (p) => p.module === module && p.action === action
    )

    return !!rolePerm
}
