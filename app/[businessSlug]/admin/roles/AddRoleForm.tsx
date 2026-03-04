'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, X } from 'lucide-react'
import { createRole } from '@/app/actions/adminActions'

export function AddRoleForm() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return
        setLoading(true)
        setError(null)
        try {
            const result = await createRole(name.trim(), description.trim() || undefined)
            if (result.success) {
                setName('')
                setDescription('')
                setOpen(false)
            } else {
                setError(result.error || 'Failed to create role')
            }
        } catch (err: any) {
            setError(err.message || 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    if (!open) {
        return (
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
            </Button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-5">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Create New Role</h2>
                    <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 opacity-70" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role-name">Role Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="role-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Sales Manager"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role-desc">Description</Label>
                        <Input
                            id="role-desc"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Optional description..."
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded-lg">{error}</p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !name.trim()}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            Create Role
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
