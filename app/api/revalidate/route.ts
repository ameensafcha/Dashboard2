import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
    try {
        const { revalidateTag } = await import('next/cache')
        revalidateTag('dashboard-kpi', { expire: 0 })
        revalidateTag('dashboard-charts', { expire: 0 })
        revalidateTag('dashboard-feed', { expire: 0 })
        revalidateTag('dashboard-inventory', { expire: 0 })
        return NextResponse.json({ revalidated: true })
    } catch (e) {
        return NextResponse.json({ revalidated: false }, { status: 500 })
    }
}
