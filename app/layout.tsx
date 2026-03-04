import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '@/components/ui/toast'

export const metadata: Metadata = {
    title: 'Safcha Dashboard',
    description: 'Premium Manufacturing & Sales Management System',
    icons: {
        icon: '/favicon.ico',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                {children}
                <ToastContainer />
            </body>
        </html>
    )
}
