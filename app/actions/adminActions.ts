'use server';

import prisma from '@/lib/prisma';
import { getBusinessContext } from '@/lib/getBusinessContext';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/logAudit';
import { revalidatePath } from 'next/cache';

//
// ROLES
//

export async function getRoles() {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'view')) {
            throw new Error('Unauthorized');
        }

        const roles = await prisma.role.findMany({
            where: { businessId: ctx.businessId },
            include: {
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return roles;
    } catch (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
}

export async function createRole(name: string, description?: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'edit')) {
            throw new Error('Unauthorized');
        }

        const role = await prisma.$transaction(async (tx) => {
            const newRole = await tx.role.create({
                data: {
                    businessId: ctx.businessId,
                    name,
                    description,
                    isSystem: false // Custom roles are never system roles
                }
            });

            await logAudit({
                action: 'CREATE',
                entity: 'Role',
                entityId: newRole.name,
                module: 'admin',
                entityName: 'Role',
                details: { description }
            });

            return newRole;
        }, {
            timeout: 15000
        });

        revalidatePath('/admin/roles');
        return { success: true, role };
    } catch (error: any) {
        console.error('Error creating role:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteRole(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'delete')) {
            throw new Error('Unauthorized');
        }

        const role = await prisma.role.findUnique({ where: { id, businessId: ctx.businessId } });
        if (!role) throw new Error('Role not found');
        if (role.isSystem) throw new Error('Cannot delete system roles');

        await prisma.$transaction(async (tx) => {
            await tx.role.delete({ where: { id } });

            await logAudit({
                action: 'DELETE',
                entity: 'Role',
                entityId: role.name,
                module: 'admin',
                entityName: 'Role',
                details: { reason: 'Admin deleted role' }
            });
        }, {
            timeout: 15000
        });

        revalidatePath('/admin/roles');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting role:', error);
        return { success: false, error: error.message };
    }
}

export async function getRoleWithPermissions(id: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'view')) {
            throw new Error('Unauthorized');
        }

        const role = await prisma.role.findUnique({
            where: { id, businessId: ctx.businessId },
            include: {
                permissions: true
            }
        });

        return role;
    } catch (error) {
        console.error('Error fetching role with permissions:', error);
        return null;
    }
}

export async function updateRolePermissions(
    roleId: string,
    permissions: { module: string, action: string }[]
) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'edit')) {
            throw new Error('Unauthorized');
        }

        const role = await prisma.role.findUnique({
            where: { id: roleId, businessId: ctx.businessId }
        });

        if (!role) throw new Error('Role not found');
        if (role.isSystem) throw new Error('Cannot modify system role permissions');

        await prisma.$transaction(async (tx) => {
            // Delete existing custom permissions
            await tx.rolePermission.deleteMany({
                where: { roleId }
            });

            // Create new permissions
            if (permissions.length > 0) {
                await tx.rolePermission.createMany({
                    data: permissions.map(p => ({
                        roleId,
                        module: p.module,
                        action: p.action
                    }))
                });
            }

            await logAudit({
                action: 'UPDATE',
                entity: 'Role',
                entityId: role.name,
                module: 'admin',
                entityName: 'Role Permissions',
                details: { permissionsCount: permissions.length }
            });
        }, {
            timeout: 15000
        });

        revalidatePath(`/${ctx.businessSlug}/admin/roles/${roleId}`);
        revalidatePath(`/${ctx.businessSlug}/admin/roles`);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating role permissions:', error);
        return { success: false, error: error.message || 'Failed to update permissions' };
    }
}

//
// USERS / TEAM
//

export async function getTeamMembers() {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'view')) {
            throw new Error('Unauthorized');
        }

        const members = await prisma.businessUser.findMany({
            where: { businessId: ctx.businessId },
            include: {
                role: true
            },
            orderBy: { joinedAt: 'desc' }
        });

        return members;
    } catch (error) {
        console.error('Error fetching team members:', error);
        return [];
    }
}

export async function addTeamMember(data: {
    email: string;
    name: string;
    roleId: string;
    password: string; // For testing — in production, you'd send an invite email
}) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'create')) {
            throw new Error('Unauthorized');
        }

        // Verify role belongs to this business
        const role = await prisma.role.findFirst({
            where: { id: data.roleId, businessId: ctx.businessId }
        });
        if (!role) throw new Error('Invalid role for this business');

        // Create Supabase Auth user via Admin API
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true, // Auto-confirm for testing
            user_metadata: { full_name: data.name }
        });

        if (authError) {
            // If user already exists in Supabase, try to find them
            if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = users.find(u => u.email === data.email);
                if (!existingUser) throw new Error('User exists in auth but cannot be found');

                // Check if already a member of this business
                const existingMember = await prisma.businessUser.findUnique({
                    where: { businessId_userId: { businessId: ctx.businessId, userId: existingUser.id } }
                });
                if (existingMember) throw new Error('User is already a member of this business');

                // Add existing Supabase user to this business
                const member = await prisma.businessUser.create({
                    data: {
                        businessId: ctx.businessId,
                        userId: existingUser.id,
                        email: data.email,
                        name: data.name,
                        roleId: data.roleId,
                        isActive: true,
                        invitedBy: ctx.userId,
                    }
                });

                await logAudit({
                    action: 'CREATE',
                    entity: 'BusinessUser',
                    entityId: member.email,
                    module: 'admin',
                    entityName: 'Team Member',
                    details: { role: role.name, existingUser: true }
                });

                revalidatePath('/admin/team');
                return { success: true, member };
            }
            throw new Error(authError.message);
        }

        if (!authData.user) throw new Error('Failed to create auth user');

        // The Supabase trigger may have already created a BusinessUser row.
        // Use upsert to handle both cases: create new or update the trigger-generated one.
        const member = await prisma.businessUser.upsert({
            where: { businessId_userId: { businessId: ctx.businessId, userId: authData.user.id } },
            update: {
                // Update the trigger-created row with the correct name, role, and inviter
                email: data.email,
                name: data.name,
                roleId: data.roleId,
                isActive: true,
                invitedBy: ctx.userId,
            },
            create: {
                businessId: ctx.businessId,
                userId: authData.user.id,
                email: data.email,
                name: data.name,
                roleId: data.roleId,
                isActive: true,
                invitedBy: ctx.userId,
            }
        });

        await logAudit({
            action: 'CREATE',
            entity: 'BusinessUser',
            entityId: member.email,
            module: 'admin',
            entityName: 'Team Member',
            details: { role: role.name }
        });

        revalidatePath('/admin/team');
        return { success: true, member };
    } catch (error: any) {
        console.error('Error adding team member:', error);
        return { success: false, error: error.message };
    }
}

export async function assignUserRole(userId: string, roleId: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'edit')) {
            throw new Error('Unauthorized');
        }

        // Verify role belongs to business
        const role = await prisma.role.findFirst({
            where: { id: roleId, businessId: ctx.businessId }
        });
        if (!role) throw new Error('Invalid role');

        await prisma.$transaction(async (tx) => {
            const member = await tx.businessUser.update({
                where: {
                    id: userId // Use the BusinessUser ID directly
                },
                data: { roleId }
            });

            await logAudit({
                action: 'UPDATE',
                entity: 'BusinessUser',
                entityId: member.email,
                module: 'admin',
                entityName: 'Team Member',
                details: { newRole: role.name }
            });
        });

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error: any) {
        console.error('Error assigning role:', error);
        return { success: false, error: error.message };
    }
}

//
// AUDIT LOGS
//

export async function getAuditLogs(page = 1, limit = 50) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'view')) {
            throw new Error('Unauthorized');
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: { businessId: ctx.businessId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.auditLog.count({
                where: { businessId: ctx.businessId }
            })
        ]);

        return { logs, total, pages: Math.ceil(total / limit) };
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return { logs: [], total: 0, pages: 0 };
    }
}

//
// GLOBAL BUSINESS ASSIGNMENT (PHASE 15)
//

export async function getUserBusinessAssignments(userId: string) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'view')) {
            throw new Error('Unauthorized');
        }

        const assignments = await prisma.businessUser.findMany({
            where: { userId },
            include: {
                business: true,
                role: true
            }
        });

        return assignments;
    } catch (error) {
        console.error('Error fetching user business assignments:', error);
        return [];
    }
}

export async function getAllBusinessesWithRoles() {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'view')) {
            throw new Error('Unauthorized');
        }

        const businesses = await prisma.business.findMany({
            include: {
                roles: true
            },
            orderBy: { name: 'asc' }
        });

        return businesses;
    } catch (error) {
        console.error('Error fetching all businesses with roles:', error);
        return [];
    }
}

export async function updateUserBusinessAssignments(
    userId: string,
    email: string,
    name: string,
    assignments: { businessId: string; roleId: string }[]
) {
    try {
        const ctx = await getBusinessContext();
        if (!hasPermission(ctx, 'admin', 'edit')) {
            throw new Error('Unauthorized');
        }

        const businessIds = assignments.map(a => a.businessId);

        await prisma.$transaction(async (tx) => {
            // Remove user from businesses not in the new list
            await tx.businessUser.deleteMany({
                where: {
                    userId,
                    businessId: { notIn: businessIds }
                }
            });

            // Upsert the new assignments
            for (const assignment of assignments) {
                await tx.businessUser.upsert({
                    where: {
                        businessId_userId: {
                            businessId: assignment.businessId,
                            userId: userId
                        }
                    },
                    update: {
                        roleId: assignment.roleId,
                        isActive: true
                    },
                    create: {
                        businessId: assignment.businessId,
                        userId: userId,
                        email: email,
                        name: name,
                        roleId: assignment.roleId,
                        isActive: true,
                        invitedBy: ctx.userId
                    }
                });
            }

            // Log this globally in the current context
            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'BusinessUser Assignments',
                    entityId: userId,
                    module: 'admin',
                    entityName: 'Global Assignments',
                    details: { newAssignmentsCount: assignments.length },
                    userId: ctx.userId,
                    businessId: ctx.businessId,
                    userName: ctx.userName,
                    description: `Updated multi-business access for user ${email}`
                }
            });
        });

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating global assignments:', error);
        return { success: false, error: error.message };
    }
}
