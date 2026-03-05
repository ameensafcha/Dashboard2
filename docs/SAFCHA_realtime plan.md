# 🚀 Safcha Dashboard — Realtime + Performance + Vercel Master Plan

> **Project:** ameensafcha/Dashboard2  
> **Date:** March 2026  
> **Goal:** Har device, har tab mein instant sync. Bina zaroorat DB hit nahi. Vercel par sahi kaam kare.

---

## 📋 Table of Contents

1. [Root Cause Analysis](#root-cause)
2. [PART 1 — Supabase Client Setup](#part-1)
3. [PART 2 — Realtime Sync System](#part-2)
4. [PART 3 — Smart Caching](#part-3)
5. [PART 4 — Vercel Production Fixes](#part-4)
6. [PART 5 — Reusable Components + Loading](#part-5)
7. [Din-by-Din Implementation Order](#order)
8. [Testing Checklist](#testing)
9. [Common Errors + Fixes](#errors)

---

## 🔍 Root Cause Analysis {#root-cause}

### Abhi kya galat ho raha hai

```
User A → New Client Add → Server Action → Prisma → DB  ✅
User B screen → Old data dikhta rahe                   ❌ (koi listener nahi)
User A page reload kare → Phir se Prisma call          ❌ (no cache)
Vercel Deploy → Middleware har request pe DB hit       ❌ (over-polling)
```

### 5 Root Problems

| # | Problem | Root Cause | Kis Part Mein Fix |
|---|---------|------------|-------------------|
| 1 | Realtime kaam nahi karta | `supabase.channel()` ka koi code hi nahi project mein | PART 2 |
| 2 | Baar baar loading | `unstable_cache` properly use nahi, har page visit par fresh DB call | PART 3 |
| 3 | Vercel par slow/crash | Prisma cold start, middleware over-polling, deprecated warning | PART 4 |
| 4 | Duplicate loading spinners | Har component ka alag loading state, no shared skeletons | PART 5 |
| 5 | TypeScript build fail | `Decimal` type mismatch, missing `success` checks | PART 4 Task 10 |

---

## PART 1 — Supabase Client Setup (Foundation) {#part-1}

> ⚠️ Ye sabse pehle karo — baaki sab iske upar depend karta hai.

### Current Status

- `middleware.ts` mein `@supabase/ssr` already installed hai ✅
- `lib/supabase/server.ts` bhi hai ✅
- Browser-side Supabase client **missing** hai ❌ — isliye Realtime kaam nahi karta

---

### TASK 1 — Browser Supabase Client Banana

**File:** `lib/supabase/client.ts` *(NEW FILE)*  
**Time:** 15 min  
**Priority:** 🔴 CRITICAL

**Kahan banao:** `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern — ek hi instance, baar baar nahi banta
let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
```

> **Kyun singleton?** Vercel mein har re-render par naya client nahi banana — warna WebSocket connections leak honge.

**`.env.local` mein add karo:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://nwffoqmivrcfbgzkwgyd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

> Anon key milegi: Supabase Dashboard → Project Settings → API → `anon public`

---

### TASK 2 — Supabase Dashboard Mein Realtime Tables Enable Karo

**Kahan:** Supabase Dashboard only  
**Time:** 10 min  
**Priority:** 🔴 CRITICAL

1. Jao: `https://supabase.com/dashboard/project/nwffoqmivrcfbgzkwgyd`
2. Left menu → **Database → Replication**
3. "Source" section mein har table ke saamne toggle **ON** karo:

| Table | Realtime ON karo |
|-------|-----------------|
| `clients` | ✅ |
| `companies` | ✅ |
| `orders` | ✅ |
| `order_items` | ✅ |
| `raw_materials` | ✅ |
| `finished_products` | ✅ |
| `production_batches` | ✅ |
| `transactions` | ✅ |
| `stock_movements` | ✅ |

> ⚠️ **Yeh step miss mat karo.** Bina is step ke Realtime events fire hi nahi honge — chahe code perfect ho.

---

## PART 2 — Realtime Sync System {#part-2}

### Architecture

```
Browser (koi bhi device, koi bhi tab)
│
├── useRealtimeSync hook (ek baar active, sab jagah kaam)
│   └── supabase.channel('safcha-global-v1')
│       ├── clients table → INSERT/UPDATE → upsertContact(payload.new)
│       ├── clients table → DELETE → removeContact(payload.old.id)
│       ├── companies → upsertCompany / removeCompany
│       ├── orders → updateOrderInStore
│       ├── raw_materials → API route → setRawMaterials
│       └── production_batches → API route → setBatches
│
└── Zustand Stores (memory mein)
    ├── crmStore → contacts, companies
    ├── salesStore → orders
    ├── inventoryStore → rawMaterials
    └── productionStore → batches
```

---

### TASK 3 — Master Realtime Hook Banana

**File:** `hooks/useRealtimeSync.ts` *(NEW FILE)*  
**Time:** 45 min  
**Priority:** 🔴 CRITICAL

**Kahan banao:** `hooks/useRealtimeSync.ts`

```typescript
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
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          removeContact(payload.old.id)
        } else {
          upsertContact(payload.new as any)
        }
      })

      // ── CRM: Companies ─────────────────────────
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'companies'
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          removeCompany(payload.old.id)
        } else {
          upsertCompany(payload.new as any)
        }
      })

      // ── Sales: Orders ──────────────────────────
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
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

      .subscribe((status) => {
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
      supabase.removeChannel(channel)
    }
  }, []) // Empty deps — sirf mount aur unmount par
}
```

> **Note:** Ek hi channel mein sab tables rakho. Multiple channels mat banao — har channel ek WebSocket connection leta hai.

---

### TASK 4 — RealtimeProvider Component Banana

**Files:**  
- `components/providers/RealtimeProvider.tsx` *(NEW FILE)*  
- `app/[businessSlug]/layout.tsx` *(EDIT)*  

**Time:** 20 min  
**Priority:** 🔴 CRITICAL

**Step 1:** `components/providers/RealtimeProvider.tsx` banao:

```typescript
'use client'

import { useRealtimeSync } from '@/hooks/useRealtimeSync'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeSync() // Ek baar activate — sab pages cover
  return <>{children}</>
}
```

**Step 2:** `app/[businessSlug]/layout.tsx` mein wrap karo:

```typescript
// app/[businessSlug]/layout.tsx
import { RealtimeProvider } from '@/components/providers/RealtimeProvider'

export default function BusinessLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <RealtimeProvider>   {/* ← Yahan wrap karo */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </RealtimeProvider>
      </div>
    </div>
  )
}
```

> **Kyun businessSlug layout mein?** Sirf authenticated pages mein Realtime chahiye. Root layout mein lagao toh login page par bhi chalega — unnecessary.

---

### TASK 5 — Lightweight Sync API Routes Banana

**Files:**  
- `app/api/sync/raw-materials/route.ts` *(NEW FILE)*  
- `app/api/sync/batches/route.ts` *(NEW FILE)*  

**Time:** 30 min  
**Priority:** 🟡 HIGH

**`app/api/sync/raw-materials/route.ts`:**

```typescript
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
```

**`app/api/sync/batches/route.ts`** — same pattern, `productionBatch.findMany()` use karo.

---

## PART 3 — Smart Caching (No Unnecessary DB Calls) {#part-3}

### Strategy

```
First Visit:
  Server Page → unstable_cache check → Cache miss → Prisma → DB → Cache store → UI

Second Visit (koi change nahi hua):
  Server Page → unstable_cache check → Cache HIT → Data directly → UI
  ✅ Zero DB call

Koi CRUD hua:
  Server Action → Prisma → DB → revalidateTag() → Cache clear
  Next visit → Fresh data
  + Realtime → Doosre devices par instant update (no refresh needed)
```

### Caching Table

| Module | TTL | Tag |
|--------|-----|-----|
| CEO Dashboard KPIs | 3600s | `dashboard-kpi-{businessId}` |
| CRM Contacts | 300s | `contacts-{businessId}` |
| CRM Companies | 300s | `companies-{businessId}` |
| Sales Orders | 120s | `orders-{businessId}` |
| Inventory | 600s | `inventory-{businessId}` |
| Production | 300s | `production-{businessId}` |
| Finance | 3600s | `finance-{businessId}` |

---

### TASK 6 — CRM Contacts + Companies Caching

**Files:** `app/actions/crm/contacts.ts` *(EDIT)*, `app/actions/crm/companies.ts` *(EDIT)*  
**Time:** 30 min  
**Priority:** 🟡 HIGH

**`app/actions/crm/contacts.ts` mein `getContacts()` ko replace karo:**

```typescript
import { unstable_cache } from 'next/cache'

// Cached getter
const getCachedContacts = (businessId: string) => unstable_cache(
  async () => {
    const contacts = await prisma.client.findMany({
      where: { deletedAt: null, businessId },
      include: {
        company: { select: { id: true, name: true, industry: true } },
        _count: { select: { deals: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return serializeValues(contacts)
  },
  [`contacts-${businessId}`],
  {
    tags: [`contacts`, `contacts-${businessId}`],
    revalidate: 300 // 5 min fallback
  }
)

export async function getContacts(search?: string) {
  const ctx = await getBusinessContext()
  if (!hasPermission(ctx, 'crm', 'view')) throw new Error('Unauthorized')

  const data = await getCachedContacts(ctx.businessId)()

  // Search client-side filtering (cache invalidate nahi karna)
  if (search) {
    const q = search.toLowerCase()
    return data.filter((c: any) =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.name?.toLowerCase().includes(q)
    )
  }
  return data
}
```

**`createContact()`, `updateContact()`, `deleteContact()` mein yeh add karo:**

```typescript
// Har mutation ke baad — revalidatePath hatao, sirf revalidateTag rakho
import { revalidateTag } from 'next/cache'

// createContact ke end mein:
revalidateTag(`contacts-${ctx.businessId}`)
revalidateTag(`dashboard-kpi-${ctx.businessId}`)

// revalidatePath('/crm/contacts') ← YEH HATAO — duplicate hai
```

---

### TASK 7 — Zustand Store Client-Side Cache (No Re-fetch on Navigate)

**Files:** Har `*Client.tsx` component *(EDIT)*  
**Time:** 25 min  
**Priority:** 🟡 HIGH

**Pattern — `ContactsClient.tsx` mein:**

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { useCrmStore } from '@/stores/crmStore'

export function ContactsClient({ initialContacts }: { initialContacts: Contact[] }) {
  const { contacts, setContacts } = useCrmStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      // Sirf pehli baar — agar store empty hai toh initialData use karo
      if (contacts.length === 0) {
        setContacts(initialContacts)
      }
      initialized.current = true
    }
  }, []) // ← Empty deps zaroori hai

  // 'contacts' ab Realtime se automatically update hoga
  // Page navigate karne par dobara fetch nahi hoga — store mein hai
  return <DataTable data={contacts} />
}
```

**Same pattern lagao:** `CompaniesClient`, `OrdersClient`, `RawMaterialsClient`, `BatchesClient`

---

## PART 4 — Vercel Production Fixes {#part-4}

> Ye sab fixes specifically Vercel ke liye hain. Local mein sab theek lagta hai par Vercel par fail hota hai.

---

### TASK 8 — Middleware Fix

**File:** `middleware.ts` *(EDIT)*, `next.config.ts` *(EDIT)*  
**Time:** 20 min  
**Priority:** 🔴 CRITICAL

**Problem 1:** `middleware` file convention deprecated — Next.js 16 mein `proxy` use karna hai.

**Fix Option A (Easy):** `middleware.ts` ko `proxy.ts` rename karo. Next.js automatically detect karega.

**Fix Option B:** `middleware.ts` rakho lekin warning suppress karo `next.config.ts` mein:

```typescript
// next.config.ts
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Multiple lockfiles warning fix
  turbopack: {
    root: __dirname
  },

  // Bundle size optimize
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@hello-pangea/dnd']
  }
}

export default nextConfig
```

**Problem 2:** Middleware mein `supabase.auth.getUser()` har request par call hoti hai — over-polling.

**Fix — `middleware.ts` matcher optimize karo:**

```typescript
export const config = {
  matcher: [
    // Sirf actual pages — static files, images, API routes exclude
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
```

---

### TASK 9 — Prisma Vercel Cold Start Fix (MOST IMPORTANT)

**File:** `lib/prisma.ts` *(EDIT)*, Vercel env vars *(EDIT)*  
**Time:** 15 min  
**Priority:** 🔴 CRITICAL

**Problem:** Vercel mein har serverless function naya process start karta hai. Direct PostgreSQL connection `max_connections` exceed kar deta hai — `"too many connections"` error aata hai.

**Fix Step 1:** Supabase Connection Pooler URL lao:
1. Supabase Dashboard → Database → Connection Pooling
2. **Transaction mode** select karo
3. Connection string copy karo — port `6543` wali

**Fix Step 2:** Vercel mein env vars set karo:
```
# Vercel Dashboard → Settings → Environment Variables
DATABASE_URL = postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Local .env.local mein direct connection rakho (port 5432)
DATABASE_URL = postgresql://postgres:[password]@db.nwffoqmivrcfbgzkwgyd.supabase.co:5432/postgres
```

**Fix Step 3:** `lib/prisma.ts` update karo:

```typescript
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
```

---

### TASK 10 — TypeScript Build Errors Fix

**Files:** Multiple *(EDIT)*  
**Time:** 30 min  
**Priority:** 🔴 CRITICAL

**Error 1 — `LogMovementModal.tsx` line 51:**

```typescript
// ❌ GALAT
type: formData.type,

// ✅ SAHI
import { StockMovementType } from '@prisma/client'
type: formData.type as StockMovementType,
```

**Error 2 — `finance/transactions/page.tsx`:**

```typescript
// ❌ GALAT — Decimal type mismatch
transactions: transactions

// ✅ SAHI — Number() conversion
transactions: transactions.map(t => ({
  ...t,
  amount: Number(t.amount)
}))
```

**Error 3 — `RawMaterialsClient.tsx`, `BatchesClient.tsx`, `OrdersClient.tsx`:**

```typescript
// ❌ GALAT — success check nahi
const data = result.materials

// ✅ SAHI
if (!result.success) {
  console.error(result.error)
  return
}
const data = result.materials
```

**Verify karo:**

```bash
npm run build
# Zero TypeScript errors hone chahiye
```

---

### TASK 11 — Settings Page Dynamic Fix

**File:** `app/[businessSlug]/settings/page.tsx` *(EDIT)*  
**Time:** 5 min  
**Priority:** 🟡 HIGH

```typescript
// File ke top par yeh add karo
export const dynamic = 'force-dynamic'

// Baaki code same rehne do
```

---

## PART 5 — Reusable Components + Loading States {#part-5}

---

### TASK 12 — Shared Skeleton Components

**File:** `components/ui/skeletons.tsx` *(NEW FILE)*  
**Time:** 40 min  
**Priority:** 🟡 HIGH

```typescript
// components/ui/skeletons.tsx

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-9 rounded-md animate-pulse" style={{ background: 'var(--muted)' }} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-8 rounded-md animate-pulse" style={{ background: 'var(--muted)', opacity: 1 - i * 0.1 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function KPICardSkeleton() {
  return (
    <div className="p-4 rounded-xl border animate-pulse" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="h-3 w-20 rounded mb-3" style={{ background: 'var(--muted)' }} />
      <div className="h-8 w-28 rounded mb-2" style={{ background: 'var(--muted)' }} />
      <div className="h-3 w-16 rounded" style={{ background: 'var(--muted)' }} />
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6 animate-pulse">
      <div>
        <div className="h-7 w-40 rounded mb-2" style={{ background: 'var(--muted)' }} />
        <div className="h-4 w-24 rounded" style={{ background: 'var(--muted)' }} />
      </div>
      <div className="h-10 w-32 rounded-lg" style={{ background: 'var(--muted)' }} />
    </div>
  )
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="p-4 rounded-xl border animate-pulse" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded mb-3 last:mb-0" style={{ background: 'var(--muted)', width: `${100 - i * 15}%` }} />
      ))}
    </div>
  )
}
```

---

### TASK 13 — Next.js `loading.tsx` Files Banana

**Files:** Har module folder mein *(NEW FILES)*  
**Time:** 20 min  
**Priority:** 🟡 HIGH

Next.js App Router automatically `loading.tsx` ko Suspense boundary ki tarah use karta hai — page load hote waqt ye dikhta hai.

**`app/[businessSlug]/crm/loading.tsx`:**

```typescript
import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <div className="p-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} cols={5} />
    </div>
  )
}
```

**Yahi pattern in folders mein banao:**

```
app/[businessSlug]/crm/loading.tsx          ← TableSkeleton rows=8 cols=5
app/[businessSlug]/sales/loading.tsx        ← TableSkeleton rows=8 cols=6
app/[businessSlug]/inventory/loading.tsx    ← TableSkeleton rows=8 cols=5
app/[businessSlug]/production/loading.tsx   ← TableSkeleton rows=6 cols=5
app/[businessSlug]/finance/loading.tsx      ← KPICardSkeleton x4 + TableSkeleton
app/[businessSlug]/(dashboard)/loading.tsx  ← KPICardSkeleton x4 + CardSkeleton x2
```

---

### TASK 14 — Error Boundaries

**Files:** Har module folder mein `error.tsx` *(NEW FILES)*  
**Time:** 25 min  
**Priority:** 🟢 MEDIUM

**`app/[businessSlug]/crm/error.tsx`:**

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
        Kuch galat ho gaya
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-sm text-red-500">{error.message}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent-gold)', color: 'black' }}
        >
          Dobara Try Karo
        </button>
        <button
          onClick={() => router.refresh()}
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          Page Refresh
        </button>
      </div>
    </div>
  )
}
```

**Yahi pattern in folders mein banao:** `crm/`, `sales/`, `inventory/`, `production/`, `finance/`

---

## 📅 Din-by-Din Implementation Order {#order}

### Din 1 — Foundation + Vercel Fixes (3-4 ghante)

```
Subah:
  ✅ Task 1  — lib/supabase/client.ts banao (15 min)
  ✅ Task 2  — Supabase Dashboard Replication ON karo (10 min)
  ✅ Task 10 — TypeScript build errors fix karo (30 min)
  ✅ npm run build — zero errors confirm karo

Dopahar:
  ✅ Task 8  — middleware.ts + next.config.ts fix (20 min)
  ✅ Task 9  — Prisma pooler URL Vercel mein set karo (15 min)
  ✅ Task 11 — Settings page dynamic fix (5 min)
  ✅ Vercel pe deploy karo — check karo sahi chal raha hai
```

### Din 2 — Realtime System (3-4 ghante)

```
  ✅ Task 3  — hooks/useRealtimeSync.ts banao (45 min)
  ✅ Task 4  — RealtimeProvider + layout mein lagao (20 min)
  ✅ Task 5  — API sync routes banao (30 min)

  TEST: Phone + Laptop dono par kholo
        Laptop se contact add karo
        Phone par 2-3 second mein update hona chahiye ✅
```

### Din 3 — Caching (2-3 ghante)

```
  ✅ Task 6  — CRM, Sales, Inventory, Production caching (30 min)
  ✅ Task 7  — Zustand store client-side init pattern (25 min)

  TEST: Network tab open karo
        Pages navigate karo
        Dobara wahi page jao — koi new DB call nahi honi chahiye ✅
```

### Din 4 — Reusable Components (2-3 ghante)

```
  ✅ Task 12 — components/ui/skeletons.tsx banao (40 min)
  ✅ Task 13 — loading.tsx files banao (20 min)
  ✅ Task 14 — error.tsx files banao (25 min)

  TEST: Slow network simulate karo (DevTools → Network → Slow 3G)
        Loading skeletons dikhne chahiye ✅
```

---

## 🧪 Testing Checklist {#testing}

### Realtime Test

```
1. Chrome (laptop) → /crm/contacts kholo
2. Phone → same URL kholo
3. Laptop se "New Contact" add karo
4. ✅ Phone par 2-3 second mein contact dikhna chahiye — bina refresh
5. Chrome DevTools → Network → WS tab → WebSocket connection dikhna chahiye
6. Console mein "✅ Realtime connected — all tables syncing" message
```

### Caching Test

```
1. /crm/contacts kholo — Network tab dekho
2. Koi doosra page jao
3. Wapis /crm/contacts jao
4. ✅ Koi naya API call nahi hona chahiye (store mein data hai)
5. Naya contact add karo — ab fresh data fetch hona chahiye
```

### Vercel Test

```
1. npm run build locally — zero errors
2. Vercel deploy karo
3. ✅ "too many connections" error nahi aana chahiye
4. ✅ Settings page render hona chahiye
5. ✅ Middleware deprecated warning nahi
```

---

## 🔧 Common Errors + Fixes {#errors}

| Error | Fix |
|-------|-----|
| Realtime kaam nahi | Supabase Dashboard → Replication mein tables ON hain? `NEXT_PUBLIC` env vars set hain? |
| `"too many connections"` Vercel | Pooler URL (port 6543) `DATABASE_URL` mein use karo |
| Build fail — Decimal type | `Number(prismaField)` conversion server actions mein add karo |
| Settings page render error | `export const dynamic = 'force-dynamic'` add karo |
| Multiple lockfiles warning | `next.config.ts` mein `turbopack: { root: __dirname }` add karo |
| Realtime fires but UI update nahi | Zustand store mein `upsertContact` ka type match check karo |
| WebSocket disconnect hota hai | `useEffect` cleanup mein `supabase.removeChannel(channel)` confirm karo |
| Auth polling zyada | `middleware.ts` matcher mein `/api/` ko exclude karo |

---

## 📝 Environment Variables Checklist

```env
# Local (.env.local) — Direct connection
DATABASE_URL=postgresql://postgres:[password]@db.nwffoqmivrcfbgzkwgyd.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://nwffoqmivrcfbgzkwgyd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Vercel Dashboard — Pooler connection (ALAG HAI)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
NEXT_PUBLIC_SUPABASE_URL=https://nwffoqmivrcfbgzkwgyd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> ⚠️ Local aur Vercel mein `DATABASE_URL` **different** hona chahiye — local direct (5432), Vercel pooler (6543).

---

*Plan prepared by Claude — March 2026 | Safcha Dashboard (ameensafcha/Dashboard2)*
