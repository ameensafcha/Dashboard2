'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCrmStore } from '@/stores/crmStore'
import { useSalesStore } from '@/stores/salesStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useProductionStore } from '@/stores/productionStore'
import { revalidateDashboard } from '@/app/actions/dashboard'

export function useRealtimeSync(businessId: string) {
    // Memoize the client so it doesn't recreate on every render
    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()
    const queryClient = useQueryClient()

    const channelRef = useRef<any>(null)
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
    const inventoryTimerRef = useRef<NodeJS.Timeout | null>(null)
    const productionTimerRef = useRef<NodeJS.Timeout | null>(null)

    const { upsertContact, removeContact, upsertCompany, removeCompany } = useCrmStore()
    const { updateOrderInStore } = useSalesStore()
    const { setRawMaterials } = useInventoryStore()
    const { setBatches } = useProductionStore()

    // ── Debounced Server Refresh ──
    const triggerRefresh = useCallback(() => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = setTimeout(async () => {
            try {
                await revalidateDashboard(businessId)

                // Invalidate all dashboard React Query caches
                queryClient.invalidateQueries({ queryKey: ['dashboard-activity-feed'] })
                queryClient.invalidateQueries({ queryKey: ['dashboard-kpi'] })
                queryClient.invalidateQueries({ queryKey: ['dashboard-low-stock'] })
                queryClient.invalidateQueries({ queryKey: ['dashboard-revenue-trend'] })
                queryClient.invalidateQueries({ queryKey: ['dashboard-sales-channel'] })
            } catch (e) {
                console.error('Refresh failed', e);
            }
            router.refresh()
        }, 1500)
    }, [router, businessId, queryClient])

    // ── Debounced Inventory Fetch ──
    const triggerInventorySync = useCallback(() => {
        if (inventoryTimerRef.current) clearTimeout(inventoryTimerRef.current)
        inventoryTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetch('/api/sync/raw-materials')
                const data = await res.json()
                if (data.materials) setRawMaterials(data.materials)
            } catch (e) {
                console.error('Inventory sync failed:', e)
            }
        }, 1500)
    }, [setRawMaterials])

    // ── Debounced Production Fetch ──
    const triggerProductionSync = useCallback(() => {
        if (productionTimerRef.current) clearTimeout(productionTimerRef.current)
        productionTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetch('/api/sync/batches')
                const data = await res.json()
                if (data.batches) setBatches(data.batches)
            } catch (e) {
                console.error('Production sync failed:', e)
            }
        }, 1500)
    }, [setBatches])

    useEffect(() => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
        }

        let channel = supabase.channel('safcha-global-v1')

        // 1. ── SPECIAL TABLES (Custom Logic) ─────────────────
        channel = channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload: any) => {
                if (payload.eventType === 'DELETE') {
                    removeContact(payload.old.id)
                } else {
                    const data = payload.new
                    upsertContact({ ...data, companyId: data.company_id, businessId: data.business_id, lastContacted: data.last_contacted, createdAt: data.created_at, updatedAt: data.updated_at, deletedAt: data.deleted_at } as any)
                }
                triggerRefresh()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, (payload: any) => {
                if (payload.eventType === 'DELETE') {
                    removeCompany(payload.old.id)
                } else {
                    const data = payload.new
                    upsertCompany({ ...data, lifetimeValue: data.lifetime_value, pricingTierId: data.pricing_tier_id, businessId: data.business_id, createdAt: data.created_at, updatedAt: data.updated_at, deletedAt: data.deleted_at } as any)
                }
                triggerRefresh()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
                if (payload.eventType !== 'DELETE') updateOrderInStore(payload.new.id, payload.new as any)
                triggerRefresh()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'raw_materials' }, () => {
                triggerInventorySync()
                triggerRefresh() // Run parallel with fetch
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, () => {
                triggerProductionSync()
                triggerRefresh() // Run parallel with fetch
            })

        // 2. ── GENERIC TABLES (Only triggerRefresh) ──────────
        const genericTables = [
            'transactions', 'stock_movements', 'finished_products', 'deals',
            'expenses', 'order_items', 'invoices', 'batch_items',
            'quality_checks', 'campaigns', 'strategies', 'objectives',
            'key_results', 'events', 'tasks', 'documents'
        ]

        genericTables.forEach(table => {
            channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                triggerRefresh()
            })
        })

        // 3. ── SUBSCRIBE & CLEANUP ───────────────────────────
        channel.subscribe((status: string) => {
            if (status === 'SUBSCRIBED') console.log('✅ Realtime connected — all tables syncing')
            if (status === 'CHANNEL_ERROR') console.error('❌ Realtime connection error — retrying...')
        })

        channelRef.current = channel

        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
            if (inventoryTimerRef.current) clearTimeout(inventoryTimerRef.current)
            if (productionTimerRef.current) clearTimeout(productionTimerRef.current)
            if (channel) supabase.removeChannel(channel)
        }
    }, [
        supabase,
        triggerRefresh,
        triggerInventorySync,
        triggerProductionSync,
        removeContact,
        upsertContact,
        removeCompany,
        upsertCompany,
        updateOrderInStore
    ])
}