'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCrmStore } from '@/stores/crmStore'
import { useSalesStore } from '@/stores/salesStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useProductionStore } from '@/stores/productionStore'

export function useRealtimeSync() {
    const supabase = createClient()
    const channelRef = useRef<any>(null)

    const { upsertContact, removeContact, upsertCompany, removeCompany } = useCrmStore()
    const { updateOrderInStore } = useSalesStore()
    const { setRawMaterials } = useInventoryStore()
    const { setBatches } = useProductionStore()

    useEffect(() => {
        // Pehle old channel close karo (cleanup)
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
        }

        const channel = supabase
            .channel('safcha-global-v1')

            // ── CRM: Contacts ──────────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clients'
            }, (payload: any) => {
                if (payload.eventType === 'DELETE') {
                    removeContact(payload.old.id)
                } else {
                    const data = payload.new;
                    const mappedContact = {
                        ...data,
                        companyId: data.company_id,
                        businessId: data.business_id,
                        lastContacted: data.last_contacted,
                        createdAt: data.created_at,
                        updatedAt: data.updated_at,
                        deletedAt: data.deleted_at,
                    };
                    upsertContact(mappedContact as any)
                }
            })

            // ── CRM: Companies ─────────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'companies'
            }, (payload: any) => {
                if (payload.eventType === 'DELETE') {
                    removeCompany(payload.old.id)
                } else {
                    const data = payload.new;
                    const mappedCompany = {
                        ...data,
                        lifetimeValue: data.lifetime_value,
                        pricingTierId: data.pricing_tier_id,
                        businessId: data.business_id,
                        createdAt: data.created_at,
                        updatedAt: data.updated_at,
                        deletedAt: data.deleted_at,
                    };
                    upsertCompany(mappedCompany as any)
                }
            })

            // ── Sales: Orders ──────────────────────────
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders'
            }, (payload: any) => {
                updateOrderInStore(payload.new.id, payload.new as any)
            })

            // ── Inventory: Raw Materials ───────────────
            // Complex relations hain, isliye API route se re-fetch
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'raw_materials'
            }, async () => {
                try {
                    const res = await fetch('/api/sync/raw-materials')
                    const data = await res.json()
                    if (data.materials) setRawMaterials(data.materials)
                } catch (e) {
                    console.error('Inventory sync failed:', e)
                }
            })

            // ── Production: Batches ────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'production_batches'
            }, async () => {
                try {
                    const res = await fetch('/api/sync/batches')
                    const data = await res.json()
                    if (data.batches) setBatches(data.batches)
                } catch (e) {
                    console.error('Production sync failed:', e)
                }
            })

            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Realtime connected — all tables syncing')
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Realtime connection error — retrying...')
                }
            })

        channelRef.current = channel

        // Cleanup on unmount
        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, []) // Empty deps — sirf mount aur unmount par
}
