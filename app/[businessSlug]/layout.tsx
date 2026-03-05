import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import RootClientLayout from '@/components/layout/RootClientLayout'
import { RealtimeProvider } from '@/components/providers/RealtimeProvider'

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

  // 2. Find the business by slug
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true, name: true }
  })
  if (!business) {
    redirect('/select-business')
  }

  // 3. Verify the user is a member of this business
  const membership = await prisma.businessUser.findUnique({
    where: { businessId_userId: { businessId: business.id, userId: user.id } },
    select: { isActive: true }
  })
  if (!membership || !membership.isActive) {
    redirect('/select-business')
  }

  // 4. Ensure the cookie is set for this business.
  //    If cookie is missing or pointing to a different business,
  //    go through the Route Handler which sets the cookie and comes back.
  const cookieStore = await cookies()
  const currentBusinessId = cookieStore.get('active-business-id')?.value
  if (currentBusinessId !== business.id) {
    redirect(`/api/auth/select-business?id=${business.id}`)
  }

  return (
    <RootClientLayout>
      <RealtimeProvider>
        {children}
      </RealtimeProvider>
    </RootClientLayout>
  )
}

