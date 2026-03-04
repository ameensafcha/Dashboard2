'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/appStore'
import { getSessionUser } from '@/app/actions/auth/session'
import { usePathname } from 'next/navigation'

/**
 * SessionProvider loads the user's role, permissions, and profile
 * from the server and hydrates the Zustand appStore.
 * 
 * It runs on mount AND whenever the pathname changes (to catch
 * cookie changes after business selection).
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
    const { setUser, user } = useAppStore()
    const pathname = usePathname()
    const loadedRef = useRef(false)

    const publicRoutes = ['/login', '/onboarding', '/select-business']
    const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith(r))

    useEffect(() => {
        // Don't load on public routes
        if (isPublic) return

        async function loadSession() {
            try {
                const sessionUser = await getSessionUser()
                if (sessionUser) {
                    setUser({
                        ...sessionUser,
                        avatar: sessionUser.avatar ?? undefined,
                    })
                    loadedRef.current = true
                } else if (loadedRef.current) {
                    // User was loaded before but now returns null → session expired
                    setUser(null)
                }
            } catch (err) {
                console.error('Failed to load session:', err)
            }
        }

        loadSession()
    }, [pathname, isPublic, setUser])

    return <>{children}</>
}
