'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { updateRolePermissions } from '@/app/actions/adminActions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { MODULES_CONFIG } from '@/lib/permissions-config';

interface Permission {
    module: string;
    action: string;
}

interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: Permission[];
}

interface ModuleDef {
    name: string;
    label: string;
    abilities: string[];
}

const MODULES: ModuleDef[] = MODULES_CONFIG.map(m => ({
    name: m.key,
    label: m.label,
    abilities: [...m.actions]
}));

export function RolePermissionsClient({ role, businessSlug }: { role: Role; businessSlug: string }) {
    const router = useRouter();
    const [permissions, setPermissions] = useState<Permission[]>(role.permissions);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Track original permissions to detect changes
    const [basePermissions, setBasePermissions] = useState<Permission[]>(role.permissions);

    const isDirty = JSON.stringify([...permissions].sort((a, b) => (a.module + a.action).localeCompare(b.module + b.action))) !==
        JSON.stringify([...basePermissions].sort((a, b) => (a.module + a.action).localeCompare(b.module + b.action)));

    const hasPerm = (module: string, action: string) =>
        permissions.some(p => p.module === module && p.action === action);

    const togglePerm = (module: string, action: string) => {
        setPermissions(prev => {
            const exists = prev.some(p => p.module === module && p.action === action);
            if (exists) {
                return prev.filter(p => !(p.module === module && p.action === action));
            } else {
                return [...prev, { module, action }];
            }
        });
        setSuccess(false);
    };

    const toggleModuleAll = (module: string, abilities: string[]) => {
        const allPresent = abilities.every(a => hasPerm(module, a));
        if (allPresent) {
            // Remove all
            setPermissions(prev => prev.filter(p => p.module !== module));
        } else {
            // Add all missing
            setPermissions(prev => {
                const otherModules = prev.filter(p => p.module !== module);
                const modulePerms = abilities.map(a => ({ module, action: a }));
                return [...otherModules, ...modulePerms];
            });
        }
        setSuccess(false);
    };

    async function handleSave() {
        setIsLoading(true);
        const result = await updateRolePermissions(role.id, permissions);
        if (result.success) {
            setSuccess(true);
            setBasePermissions(permissions);
            toast({
                title: "Permissions Updated",
                description: `Successfully updated permissions for ${role.name}.`,
                type: "success"
            });
            router.refresh();
        } else {
            toast({
                title: "Update Failed",
                description: result.error || "Could not save permission changes.",
                type: "error"
            });
        }
        setIsLoading(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/${businessSlug}/admin/roles`}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{role.name}</h1>
                            {role.isSystem && <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">System Role</Badge>}
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {role.description || 'Configure granular access for this role.'}
                        </p>
                    </div>
                </div>
                <div className="sm:ml-auto flex items-center gap-3">
                    {success && (
                        <div className="flex items-center gap-2 text-green-500 text-sm font-medium animate-in fade-in slide-in-from-right-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Changes saved
                        </div>
                    )}
                    <Button
                        disabled={role.isSystem || isLoading || !isDirty}
                        onClick={handleSave}
                        className={cn(
                            "shadow-lg transition-all",
                            isDirty ? "bg-[var(--primary)] hover:bg-[var(--primary)]/90 shadow-[var(--primary)]/20" : "bg-muted text-muted-foreground opacity-50 shadow-none"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {role.isSystem && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-4 rounded-xl text-sm font-medium">
                    ⚠️ <strong>Note:</strong> System roles have fixed permissions that cannot be modified.
                </div>
            )}

            <div className="grid gap-6">
                {MODULES.map((mod) => (
                    <Card key={mod.name} className="overflow-hidden border-none shadow-md bg-[var(--card)]">
                        <CardHeader className="pb-4 bg-muted/30 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold">{mod.label}</CardTitle>
                                    <CardDescription className="text-xs uppercase tracking-wider font-semibold opacity-70 mt-0.5">
                                        Module Identifier: {mod.name}
                                    </CardDescription>
                                </div>
                                {!role.isSystem && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs font-bold h-7"
                                        onClick={() => toggleModuleAll(mod.name, mod.abilities)}
                                    >
                                        {mod.abilities.every(a => hasPerm(mod.name, a)) ? 'Clear All' : 'Select All'}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {mod.abilities.map((ability) => (
                                    <div key={`${mod.name}-${ability}`} className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor={`${mod.name}-${ability}`}
                                                className="capitalize text-sm font-semibold cursor-pointer select-none"
                                            >
                                                {ability}
                                            </Label>
                                            <Switch
                                                id={`${mod.name}-${ability}`}
                                                disabled={role.isSystem}
                                                checked={hasPerm(mod.name, ability)}
                                                onCheckedChange={() => togglePerm(mod.name, ability)}
                                            />
                                        </div>
                                        <div className="text-[10px] text-muted-foreground leading-relaxed">
                                            Allow {ability} operations in the {mod.name} module.
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
