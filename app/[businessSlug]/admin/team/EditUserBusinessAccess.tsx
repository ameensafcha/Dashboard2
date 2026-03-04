'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getUserBusinessAssignments, updateUserBusinessAssignments } from '@/app/actions/adminActions';
import { Shield, Loader2, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface BusinessWithRoles {
    id: string;
    name: string;
    roles: { id: string; name: string; isSystem: boolean }[];
}

export function EditUserBusinessAccess({
    user,
    allBusinesses
}: {
    user: { id: string; name: string | null; email: string };
    allBusinesses: BusinessWithRoles[];
}) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // State to hold the drafted assignments
    // Map of businessId -> roleId
    const [assignments, setAssignments] = useState<Record<string, string>>({});

    async function handleOpen() {
        setOpen(true);
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const currentAssignments = await getUserBusinessAssignments(user.id);
            const assignmentMap: Record<string, string> = {};
            currentAssignments.forEach((a: any) => {
                assignmentMap[a.businessId] = a.roleId;
            });
            setAssignments(assignmentMap);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch assignments');
        } finally {
            setIsLoading(false);
        }
    }

    function toggleBusiness(businessId: string, defaultRoleId: string, checked: boolean) {
        setAssignments(prev => {
            const next = { ...prev };
            if (checked) {
                next[businessId] = defaultRoleId;
            } else {
                delete next[businessId];
            }
            return next;
        });
    }

    function changeRole(businessId: string, roleId: string) {
        setAssignments(prev => ({
            ...prev,
            [businessId]: roleId
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        const assignmentsArray = Object.entries(assignments).map(([businessId, roleId]) => ({
            businessId,
            roleId
        }));

        const result = await updateUserBusinessAssignments(
            user.id,
            user.email,
            user.name || 'Unknown User',
            assignmentsArray
        );

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                setOpen(false);
                setSuccess(false);
            }, 1000);
        } else {
            setError(result.error || 'Failed to update access');
        }
        setIsSaving(false);
    }

    return (
        <>
            <Button variant="ghost" size="icon" title="Manage Business Access" onClick={handleOpen}>
                <Shield className="h-4 w-4 text-muted-foreground" />
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-[var(--border)] shrink-0">
                            <div>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Business Access</h3>
                                <p className="text-sm text-muted-foreground">{user.name || user.email}</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-white/10 shrink-0">
                                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                                </div>
                            ) : (
                                <form id="access-form" onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                            <AlertTriangle className="w-5 h-5 shrink-0" />
                                            <div>{error}</div>
                                        </div>
                                    )}

                                    {success && (
                                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-medium">
                                            ✅ Access updated successfully
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {allBusinesses.map(business => {
                                            const hasAccess = !!assignments[business.id];
                                            const currentRoleId = assignments[business.id];
                                            const defaultRoleId = business.roles[0]?.id || '';

                                            return (
                                                <div
                                                    key={business.id}
                                                    className={cn(
                                                        "p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center gap-4",
                                                        hasAccess ? "border-[var(--primary)]/50 bg-[var(--primary)]/5" : "border-[var(--border)] bg-[var(--muted)]/20"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <Switch
                                                            checked={hasAccess}
                                                            onCheckedChange={(c) => toggleBusiness(business.id, defaultRoleId, c)}
                                                        />
                                                        <div>
                                                            <div className="font-semibold text-sm">{business.name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {hasAccess ? 'Access Granted' : 'No Access'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {hasAccess && (
                                                        <div className="sm:w-48 shrink-0">
                                                            <Label className="text-xs mb-1.5 block opacity-70">Assigned Role</Label>
                                                            <Select
                                                                value={currentRoleId}
                                                                onValueChange={(val) => changeRole(business.id, val)}
                                                            >
                                                                <SelectTrigger className="h-9">
                                                                    <SelectValue placeholder="Select role" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {business.roles.map(role => (
                                                                        <SelectItem key={role.id} value={role.id}>
                                                                            {role.name} {role.isSystem ? '(System)' : ''}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {allBusinesses.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                No businesses available in the system.
                                            </div>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="p-6 border-t border-[var(--border)] shrink-0 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setOpen(false)} type="button">
                                Cancel
                            </Button>
                            <Button type="submit" form="access-form" disabled={isLoading || isSaving}>
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
