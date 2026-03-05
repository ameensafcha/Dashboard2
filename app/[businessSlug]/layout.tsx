import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import RootClientLayout from '@/components/layout/RootClientLayout'
import { RealtimeProvider } from '@/components/providers/RealtimeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ businessSlug: string }>
}) {
  const { businessSlug } = await params

  // 1. Verify the user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Find the business and verify membership in a single query
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: {
      id: true,
      name: true,
      users: {
        where: { userId: user.id, isActive: true },
        select: { isActive: true }
      }
    }
  })

  if (!business || business.users.length === 0) {
    redirect('/select-business')
  }

  // 4. Ensure the cookie is set for this business.
  const cookieStore = await cookies()
  const currentBusinessId = cookieStore.get('active-business-id')?.value
  if (currentBusinessId !== business.id) {
    redirect(`/api/auth/select-business?id=${business.id}`)
  }

  return (
    <RootClientLayout>
      <QueryProvider>
        <RealtimeProvider businessId={business.id}>
          {children}
        </RealtimeProvider>
      </QueryProvider>
    </RootClientLayout>
  )
}

