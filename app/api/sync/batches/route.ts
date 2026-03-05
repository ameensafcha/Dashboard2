import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        // Auth check
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const batches = await prisma.productionBatch.findMany({
            where: { deletedAt: null },
            include: {
                product: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({
            batches: batches.map(b => ({
                ...b,
                targetQty: Number(b.targetQty),
                actualQty: b.actualQty ? Number(b.actualQty) : null,
            }))
        })
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
