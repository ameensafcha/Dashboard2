'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RealtimeSyncOptions {
    table: string;
    businessId: string;
    onInsert?: (payload: any) => void;
    onUpdate?: (payload: any) => void;
    onDelete?: (payload: any) => void;
    enabled?: boolean;
}

export function useRealtimeSync({
    table,
    businessId,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true
}: RealtimeSyncOptions) {
    const onInsertRef = useRef(onInsert);
    const onUpdateRef = useRef(onUpdate);
    const onDeleteRef = useRef(onDelete);

    useEffect(() => {
        onInsertRef.current = onInsert;
        onUpdateRef.current = onUpdate;
        onDeleteRef.current = onDelete;
    }, [onInsert, onUpdate, onDelete]);

    useEffect(() => {
        if (!enabled || !businessId) return;

        const supabase = createClient();
        console.log(`[Realtime] Subscribing to ${table}...`);

        const channel = supabase
            .channel(`realtime-${table}-${businessId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                    filter: `business_id=eq.${businessId}`
                },
                (payload) => {
                    console.log(`[Realtime - ${table}] Change Detected:`, payload);

                    const toCamel = (obj: any): any => {
                        if (Array.isArray(obj)) return obj.map(toCamel);
                        if (obj !== null && typeof obj === 'object') {
                            return Object.keys(obj).reduce((acc, key) => {
                                const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
                                acc[camelKey] = (toCamel as any)(obj[key]);
                                return acc;
                            }, {} as any);
                        }
                        return obj;
                    };

                    const data = payload.new ? toCamel(payload.new) : (payload.old ? toCamel(payload.old) : null);

                    switch (payload.eventType) {
                        case 'INSERT':
                            if (onInsertRef.current) onInsertRef.current(data);
                            break;
                        case 'UPDATE':
                            if (onUpdateRef.current) onUpdateRef.current(data);
                            break;
                        case 'DELETE':
                            if (onDeleteRef.current) (onDeleteRef.current as any)(data);
                            break;
                    }
                }
            )
            .subscribe((status, err) => {
                console.log(`[Realtime - ${table}] Status:`, status, err || '');
            });

        return () => {
            console.log(`[Realtime] Unsubscribing from ${table}...`);
            supabase.removeChannel(channel);
        };
    }, [table, businessId, enabled]);
}
