'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addTeamMember } from '@/app/actions/adminActions';
import { UserPlus, Loader2, X } from 'lucide-react';

interface Role {
    id: string;
    name: string;
    isSystem: boolean;
}

export function AddTeamMemberForm({ roles }: { roles: Role[] }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        roleId: roles[0]?.id || '',
        password: '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        const result = await addTeamMember(formData);

        if (result.success) {
            setSuccess(true);
            setFormData({ email: '', name: '', roleId: roles[0]?.id || '', password: '' });
            setTimeout(() => {
                setOpen(false);
                setSuccess(false);
            }, 1500);
        } else {
            setError(result.error || 'Failed to add member');
        }
        setIsLoading(false);
    }

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Add Team Member</h3>
                            <button onClick={() => { setOpen(false); setError(null); }} className="p-1 rounded-md hover:bg-white/10">
                                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Muhammad Ali"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="user@company.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password (for testing)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Min 6 characters"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    required
                                    value={formData.roleId}
                                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md border text-sm"
                                    style={{
                                        background: 'var(--muted)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--foreground)'
                                    }}
                                >
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name} {role.isSystem ? '(System)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="text-sm text-green-600 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                    ✅ Member added successfully!
                                </div>
                            )}

                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <UserPlus className="w-4 h-4 mr-2" />
                                )}
                                {isLoading ? 'Creating...' : 'Add Member'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
