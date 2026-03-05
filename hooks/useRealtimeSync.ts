'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCrmStore } from '@/stores/crmStore'
import { useSalesStore } from '@/stores/salesStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useProductionStore } from '@/stores/productionStore'
import { revalidateDashboard } from '@/app/actions/dashboard'

export function useRealtimeSync() {
    const supabase = createClient()
    const router = useRouter()
    const channelRef = useRef<any>(null)
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

    const { upsertContact, removeContact, upsertCompany, removeCompany } = useCrmStore()
    const { updateOrderInStore } = useSalesStore()
    const { setRawMaterials } = useInventoryStore()
    const { setBatches } = useProductionStore()

    // Debounced refresh — batches multiple rapid DB events into one server refresh
    // 1.5 second debounce: if 10 CRUDs happen in 1 sec, only 1 refresh fires
    const triggerRefresh = useCallback(() => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = setTimeout(async () => {
            try {
                // Use server action — it knows businessId and busts correct scoped tags
                await revalidateDashboard()
            } catch (e) {
                // Silent fail — next refresh will catch up
            }
            router.refresh()
        }, 1500)
    }, [router])

    useEffect(() => {
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
                triggerRefresh()
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
                triggerRefresh()
            })

            // ── Sales: Orders ──────────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders'
            }, (payload: any) => {
                if (payload.eventType !== 'DELETE') {
                    updateOrderInStore(payload.new.id, payload.new as any)
                }
                triggerRefresh()
            })

            // ── Sales: Transactions ────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'transactions'
            }, () => {
                triggerRefresh()
            })

            // ── Inventory: Raw Materials ───────────────
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
                triggerRefresh()
            })

            // ── Inventory: Stock Movements ─────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'stock_movements'
            }, () => {
                triggerRefresh()
            })

            // ── Inventory: Finished Products ───────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'finished_products'
            }, () => {
                triggerRefresh()
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
                triggerRefresh()
            })

            // ── CRM: Deals ──────────────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'deals'
            }, () => {
                triggerRefresh()
            })

            // ── Finance: Expenses ───────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expenses'
            }, () => {
                triggerRefresh()
            })

            // ── Sales: Order Items ──────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'order_items'
            }, () => {
                triggerRefresh()
            })

            // ── Sales: Invoices ─────────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'invoices'
            }, () => {
                triggerRefresh()
            })

            // ── Production: Batch Items ─────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'batch_items'
            }, () => {
                triggerRefresh()
            })

            // ── Production: Quality Checks ──────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'quality_checks'
            }, () => {
                triggerRefresh()
            })
            // ── Marketing: Campaigns ───────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'campaigns'
            }, () => {
                triggerRefresh()
            })
            // ── Strategy: Strategies ──────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'strategies'
            }, () => {
                triggerRefresh()
            })
            // ── Strategy: Objectives ──────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'objectives'
            }, () => {
                triggerRefresh()
            })
            // ── Strategy: Key Results ─────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'key_results'
            }, () => {
                triggerRefresh()
            })
            // ── Events: Events ────────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'events'
            }, () => {
                triggerRefresh()
            })
            // ── Team: Tasks ──────────────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tasks'
            }, () => {
                triggerRefresh()
            })
            // ── Documents: Documents ──────────────────
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'documents'
            }, () => {
                triggerRefresh()
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

        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current)
            }
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [])
}
