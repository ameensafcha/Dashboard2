import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Factory, ArrowRight, User as UserIcon, Lock, LogOut, RefreshCw } from 'lucide-react'
import { logoutUser } from '@/app/actions/auth/session'

export default async function SelectBusinessPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const memberships = await prisma.businessUser.findMany({
        where: {
            userId: user.id,
            isActive: true
        },
        include: {
            business: true,
            role: true
        }
    })

    // If no businesses at all, show access denied
    if (memberships.length === 0) {
        async function handleSignOut() {
            'use server'
            await logoutUser()
            redirect('/login')
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] p-4 text-white">
                <div className="w-full max-w-md space-y-6 bg-[#1A1A2E] p-8 rounded-2xl border border-white/10 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        Access Denied
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">
                        You don't have access to any business yet. Please contact your system administrator to assign you a role.
                    </p>
                    <div className="flex flex-col gap-3 mt-8">
                        <a href="/select-business" className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-lg p-3 transition-colors border border-white/10">
                            <RefreshCw className="w-4 h-4" />
                            Refresh Status
                        </a>
                        <form action={handleSignOut}>
                            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg p-3 transition-colors border border-red-500/20">
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    // Always show the list – clicking a card goes through the Route Handler
    // which sets the active-business-id cookie. Never auto-redirect.
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] p-4 text-white">
            <div className="w-full max-w-2xl space-y-8">
                <div className="flex flex-col items-center justify-center space-y-2 mb-12">
                    <div className="w-16 h-16 bg-[#E8A838]/10 rounded-2xl flex items-center justify-center mb-4">
                        <Factory className="w-8 h-8 text-[#E8A838]" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Select Workspace
                    </h2>
                    <p className="text-sm text-gray-400">
                        Choose a business workspace to continue
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {memberships.map((mem: any) => (
                        <a
                            href={`/api/auth/select-business?id=${mem.businessId}`}
                            key={mem.businessId}
                            className="w-full text-left bg-[#1A1A2E] p-6 rounded-2xl border border-white/10 hover:border-[#E8A838]/50 hover:bg-white/5 transition-all group relative overflow-hidden block"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                                    {mem.business.logo ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={mem.business.logo} alt={mem.business.name} className="w-8 h-8 object-contain" />
                                    ) : (
                                        <Factory className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-[#E8A838]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-4 h-4 text-[#E8A838]" />
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-1">
                                {mem.business.name}
                            </h3>

                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <UserIcon className="w-4 h-4" />
                                <span>{mem.role.name}</span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    )
}
