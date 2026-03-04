'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Coffee, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            setError(signInError.message)
            setIsLoading(false)
            return
        }

        // On success, middleware will handle redirecting to /select-business
        router.push('/select-business')
        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] p-4 text-white">
            <div className="w-full max-w-md space-y-8 bg-[#1A1A2E] p-8 rounded-2xl border border-white/10 shadow-xl">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-16 h-16 bg-[#E8A838]/10 rounded-2xl flex items-center justify-center mb-4">
                        <Coffee className="w-8 h-8 text-[#E8A838]" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Safcha Portal
                    </h2>
                    <p className="text-sm text-gray-400">
                        Sign in to access your dashboard
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E8A838] focus:ring-[#E8A838]"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E8A838] focus:ring-[#E8A838]"
                                placeholder="••••••••"
                            />
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
                            'Sign In'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
