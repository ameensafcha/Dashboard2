import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        // Auth check
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const materials = await prisma.rawMaterial.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, sku: true, category: true,
                currentStock: true, unitCost: true, reorderThreshold: true,
                reorderQuantity: true, location: true, supplierId: true,
                lastRestocked: true, expiryDate: true, createdAt: true, updatedAt: true
            }
        })

        return NextResponse.json({
            materials: materials.map(m => ({
                ...m,
                currentStock: Number(m.currentStock),
                unitCost: Number(m.unitCost),
                reorderThreshold: m.reorderThreshold ? Number(m.reorderThreshold) : null,
            }))
        })
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
