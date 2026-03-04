'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBusinessWithOwner } from '@/app/actions/auth/business'
import { Factory, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        currency: 'SAR',
        timezone: 'Asia/Riyadh'
    })
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const result = await createBusinessWithOwner(formData)
            if (result.success) {
                window.location.href = '/' // hard refresh to initialize everything
            }
        } catch (err: any) {
            setError(err.message || 'Failed to setup business. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] p-4 text-white">
            <div className="w-full max-w-lg space-y-8 bg-[#1A1A2E] p-8 rounded-2xl border border-white/10 shadow-xl">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-16 h-16 bg-[#E8A838]/10 rounded-2xl flex items-center justify-center mb-4">
                        <Factory className="w-8 h-8 text-[#E8A838]" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Setup Your Workspace
                    </h2>
                    <p className="text-sm text-gray-400 text-center">
                        Create your Safcha business profile to get started.<br />You will be set as the Owner.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-300">Business Name</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E8A838] focus:ring-[#E8A838]"
                                placeholder="Safcha Manufacturing Trading Co."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="industry" className="text-gray-300">Industry</Label>
                            <Input
                                id="industry"
                                required
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E8A838] focus:ring-[#E8A838]"
                                placeholder="Coffee Production & Roastery"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currency" className="text-gray-300">Base Currency</Label>
                                <Input
                                    id="currency"
                                    required
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E8A838] focus:ring-[#E8A838]"
                                    placeholder="SAR"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
                                <Input
                                    id="timezone"
                                    required
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E8A838] focus:ring-[#E8A838]"
                                    placeholder="Asia/Riyadh"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#E8A838] hover:bg-[#C9A84C] text-black font-semibold h-12"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Complete Setup'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
