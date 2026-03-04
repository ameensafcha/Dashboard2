# SAFCHA DASHBOARD — PHASE 10 COMPLETE MASTER PLAN
## Auth · Roles · Permissions · Extra Modules · Performance · Full Connection Map

> **Version:** 4.0 | **Date:** March 2026  
> **Based on:** Actual GitHub codebase analysis — `ameensafcha/Dashboard2`  
> **Files read:** `prisma/schema.prisma`, `components/layout/Sidebar.tsx`, `app/globals.css`, `docs/VIVA-phase-1-to-9.md`  
> **Status:** Phases 1–9 ✅ Complete | Phase 10+ ⏳ This document

---

## ⚠️ MANDATORY READING FOR AI AGENTS

> **Read this file FIRST before making any changes.**  
> Every section has exact file paths, model names, and logic that matches the actual codebase.  
> Do NOT invent file names or model fields — use exactly what is written here.

---

## SECTION 1 — PROJECT ANALYSIS (Actual State)

### 1.1 — What Is Built (Phases 1–9)

| Module | Status | Key Details from Actual Code |
|--------|--------|------------------------------|
| Product Catalog + Pricing Tiers | ✅ | `Product`, `Category`, `PricingTier`, `CompanyPricingTier` in schema |
| CRM — Companies, Contacts, Pipeline | ✅ | `Company`, `Client`, `Deal` models, 7-stage Kanban |
| Orders + OrderItems + Auto Pricing | ✅ | `Order`, `OrderItem`, `Invoice` — VAT 15%, auto grand total |
| Inventory Raw + Finished + Movements | ✅ | `RawMaterial`, `FinishedProduct`, `StockMovement` — SM-YYYY-XXXX IDs |
| Production Batches + QC 5-step | ✅ | `ProductionBatch`, `BatchItem`, `QualityCheck` |
| Finance — Transactions + Expenses | ✅ | `Transaction`, `Expense` — auto revenue on order delivery |
| CEO Dashboard — KPIs + Charts | ✅ | Recharts LineChart + PieChart, 6 real KPIs, activity feed |
| Cross-module automations | ✅ | Order→stock, batch→stock, delivery→revenue all in `$transaction` |
| Bilingual EN/AR + RTL | ✅ | `lib/i18n.ts` custom hook, `dir="rtl"` on html element |
| Dark/Light Theme | ✅ | CSS variables in `app/globals.css` — `--accent-gold`, `--card`, etc. |
| AuditLog model (basic) | ✅ | Already in schema BUT `userId` is placeholder — not populated yet |

### 1.2 — Critical Gaps (Must Fix)

| Gap | Problem | Priority |
|-----|---------|----------|
| **Zero Authentication** | Koi bhi URL khol ke sab dekh sakta — no session check | 🔴 CRITICAL |
| **No Roles / No Users** | `BusinessUser`, `Role` models hi nahi hain schema mein | 🔴 CRITICAL |
| **No Permission System** | Koi bhi action block nahi hoti | 🔴 CRITICAL |
| **AuditLog incomplete** | `userId` field hai par populate nahi hota — auth nahi hai abhi | 🔴 HIGH |
| **Invoice PDF missing** | `Invoice` record banta hai, actual PDF download nahi | 🟡 HIGH |
| **N+1 DB queries** | Orders page pe client name ke liye per-row alag query | 🟡 HIGH |
| **No loading skeletons** | Page load pe blank white flash | 🟡 MEDIUM |
| **No error boundaries** | Server action fail → UI crash, no recovery | 🟡 MEDIUM |
| **Extra modules empty** | Marketing, Events, Tasks, Docs, Strategy — sirf placeholder links | 🟡 PENDING |

---

## SECTION 2 — PERMISSION SYSTEM DESIGN

### 2.1 — Chosen Model: Dynamic Roles + Per-User Overrides

**NOT hardcoded matrix.** Admin runtime pe roles banata hai, permissions toggle karta hai.

```
Admin "Sales Manager" role banata hai
    ↓ permissions toggle karo: Orders=ON, Finance=OFF
    ↓ User invite karo → "Sales Manager" role assign karo
    ↓ Chahiye to: Ali ko Finance view do (per-user override)
```

**Why this model:**
- Admin khud role naam deta hai — "Sales Manager", "Accountant", "Production Staff"
- Role permissions DB mein store hoti hain — code change nahi karna
- Per-user override: role ke upar/neecha specific module+action grant/deny

### 2.2 — Correct Flow (Sequence Matters)

```
Step 1: Business banao (onboarding) → OWNER role auto-create → first user = OWNER
Step 2: Admin Panel → Roles tab → "New Role" banao (naam + permissions toggle)
Step 3: Admin Panel → Team tab → User invite karo → Role assign karo
Step 4: Chahiye to — specific user ko extra permission grant/deny karo (override)
Step 5: Runtime — har action pe: role permissions + override check → decision
```

### 2.3 — New Database Models (Add to `prisma/schema.prisma`)

#### Business Model
```prisma
model Business {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique   // "safcha" — URL safe
  logo        String?
  industry    String?
  country     String   @default("SA")
  currency    String   @default("SAR")
  timezone    String   @default("Asia/Riyadh")
  vatNumber   String?
  address     String?
  phone       String?
  email       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  users        BusinessUser[]
  roles        Role[]
  // + relation to all 20 existing models via businessId
  
  @@map("businesses")
}
```

#### Role Model — Admin Banata Hai
```prisma
model Role {
  id          String   @id @default(uuid())
  businessId  String   @map("business_id")
  name        String   // "Sales Manager", "Accountant" — admin sets this
  description String?
  isSystem    Boolean  @default(false) @map("is_system")
  // isSystem=true means OWNER role — cannot be deleted or edited
  color       String?  // Badge color: "#8B5CF6" etc.
  createdAt   DateTime @default(now()) @map("created_at")

  permissions RolePermission[]
  users       BusinessUser[]
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([businessId, name])
  @@index([businessId])
  @@map("roles")
}
```

#### RolePermission — Har Module+Action Ka Toggle
```prisma
model RolePermission {
  id       String @id @default(uuid())
  roleId   String @map("role_id")
  module   String // "orders", "finance", "admin", "production" etc.
  action   String // "view", "create", "edit", "delete", "approve", "export", "log_movement", "upload"

  role     Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, module, action])
  @@index([roleId])
  @@map("role_permissions")
}
```

#### BusinessUser — User ka Business mein Role
```prisma
model BusinessUser {
  id          String    @id @default(uuid())
  businessId  String    @map("business_id")
  userId      String    @map("user_id")   // Supabase auth.users UUID
  email       String
  name        String
  avatarUrl   String?   @map("avatar_url")
  roleId      String    @map("role_id")
  isActive    Boolean   @default(true) @map("is_active")
  joinedAt    DateTime  @default(now()) @map("joined_at")
  lastSeenAt  DateTime? @map("last_seen_at")
  invitedBy   String?   @map("invited_by")  // userId who invited

  role        Role      @relation(fields: [roleId], references: [id])
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  overrides   UserPermissionOverride[]

  @@unique([businessId, userId])
  @@index([businessId])
  @@index([userId])
  @@map("business_users")
}
```

#### UserPermissionOverride — Per-User Extra Grant/Deny
```prisma
model UserPermissionOverride {
  id         String   @id @default(uuid())
  businessId String   @map("business_id")
  userId     String   @map("user_id")
  module     String
  action     String
  granted    Boolean  // true = give access, false = take away access
  grantedBy  String   @map("granted_by")  // Admin userId who set this
  reason     String?
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([businessId, userId, module, action])
  @@index([businessId, userId])
  @@map("user_permission_overrides")
}
```

#### AuditLog — Upgrade Existing Model
```prisma
// Existing model already in schema — ADD these fields:
model AuditLog {
  id         String   @id @default(uuid())
  // EXISTING fields (keep these):
  action     String   // "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"
  entity     String   // "Order", "Product" etc.
  entityId   String   @map("entity_id")
  details    Json?
  userId     String?  @map("user_id")  // NOW populate from auth
  createdAt  DateTime @default(now()) @map("created_at")

  // ADD these new fields:
  businessId  String   @map("business_id")    // ADD
  userName    String?  @map("user_name")       // ADD — denormalized
  module      String?                          // ADD — "orders", "products"
  entityName  String?  @map("entity_name")     // ADD — "Order ORD-2026-0042"
  description String?                          // ADD — human readable

  @@index([entity, entityId])  // existing
  @@index([createdAt])         // existing
  @@index([businessId, createdAt])  // ADD
  @@index([businessId, userId])     // ADD
  @@map("audit_logs")
}
```

### 2.4 — businessId Add to ALL 20 Existing Models

**Add `businessId String @map("business_id")` to every model:**

```
Category, Product, PricingTier, CompanyPricingTier, Supplier,
ProductionBatch, BatchItem, QualityCheck, RndProject, SystemSettings,
Company, Client, Deal, Order, OrderItem, Invoice,
RawMaterial, FinishedProduct, StockMovement,
Transaction, Expense
```

**Migration strategy — do this in order:**
```bash
# Step 1: Add as optional first (String?)
# Step 2: npx prisma db push
# Step 3: Run seed.ts to create Business + set all existing records' businessId
# Step 4: Make required (String) + npx prisma db push again
```

### 2.5 — Modules + Actions Config (Fixed in Code — Permissions Dynamic)

**File: `lib/permissions-config.ts`**

```typescript
// This is ONLY for the admin UI (checkboxes) — actual permissions are in DB
export const MODULES_CONFIG = [
  { key: 'dashboard',   label: 'CEO Dashboard',                actions: ['view', 'export'] },
  { key: 'products',    label: 'Products & Catalog',           actions: ['view', 'create', 'edit', 'delete', 'export'] },
  { key: 'pricing',     label: 'Pricing Tiers',                actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'suppliers',   label: 'Suppliers',                    actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'crm',         label: 'CRM (Contacts, Companies, Pipeline)', actions: ['view', 'create', 'edit', 'delete', 'export'] },
  { key: 'orders',      label: 'Orders',                       actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
  { key: 'inventory',   label: 'Inventory',                    actions: ['view', 'create', 'edit', 'delete', 'log_movement', 'export'] },
  { key: 'production',  label: 'Production & QC',              actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { key: 'finance',     label: 'Finance & P&L',                actions: ['view', 'create', 'edit', 'delete', 'export'] },
  { key: 'marketing',   label: 'Marketing Campaigns',          actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'events',      label: 'Events & Expos',               actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'tasks',       label: 'Team & Tasks',                 actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'documents',   label: 'Document Vault',               actions: ['view', 'upload', 'delete'] },
  { key: 'strategy',    label: 'Strategy & OKRs',              actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'settings',    label: 'Settings',                     actions: ['view', 'edit'] },
  { key: 'admin',       label: 'Admin Panel',                  actions: ['view'] },
] as const
```

### 2.6 — Permission Resolution Logic

**File: `lib/permissions.ts`**

```typescript
export type PermissionContext = {
  userId: string
  userName: string
  businessId: string
  role: Role & { permissions: RolePermission[] }
  overrides: UserPermissionOverride[]
}

export async function hasPermission(
  ctx: PermissionContext,
  module: string,
  action: string
): Promise<boolean> {
  // Step 1: OWNER (isSystem=true) gets everything — no further checks
  if (ctx.role.isSystem) return true

  // Step 2: Per-user override — HIGHEST PRIORITY after OWNER
  const override = ctx.overrides.find(
    o => o.module === module && o.action === action
  )
  if (override !== undefined) return override.granted

  // Step 3: Role permissions from DB
  return ctx.role.permissions.some(
    p => p.module === module && p.action === action
  )
}
```

---

## SECTION 3 — PHASE 10: ALL FLOWS (Step by Step)

### Flow 1: First Time — Business Setup

```
User opens browser → visits any URL (e.g., /dashboard)
    ↓
middleware.ts intercepts — no session cookie found
    ↓
redirect → /login
    ↓
User enters email + password
Supabase signInWithPassword() called
Success → session cookie set automatically by Supabase SSR
    ↓
middleware checks: does BusinessUser exist for this userId?
No → redirect /onboarding
    ↓
/onboarding page — user fills: Business Name, Industry, Currency, Timezone
    ↓
Server action: createBusinessWithOwner()
  → prisma.$transaction([
      business = prisma.business.create({ name, slug, currency, timezone })
      ownerRole = prisma.role.create({ businessId, name: "OWNER", isSystem: true })
      ALL RolePermissions for OWNER (all modules, all actions) create
      businessUser = prisma.businessUser.create({ userId, businessId, roleId: ownerRole.id })
    ])
    ↓
Set cookie: active-business-id = business.id
redirect → /dashboard
    ↓
Dashboard loads with full OWNER access
```

### Flow 2: Admin Creates a Role

```
Admin opens Admin Panel → Roles tab (/admin/roles)
    ↓
Clicks "+ New Role" button
    ↓
Modal appears:
  - Role Name: "Sales Manager"
  - Color: pick from palette
  - Description: optional
    ↓
Save → Server action: createRole(businessId, name, color)
  → prisma.role.create({ businessId, name: "Sales Manager", isSystem: false })
  → NO permissions created yet — empty role
    ↓
Redirect to /admin/roles/[newRoleId]
    ↓
Permission toggles grid appears:
  ┌─────────────────┬────────┬─────────┬────────┬────────┬──────────┐
  │ Module          │  View  │  Create │  Edit  │ Delete │ Approve  │
  ├─────────────────┼────────┼─────────┼────────┼────────┼──────────┤
  │ CEO Dashboard   │  [ ]   │   N/A   │  N/A   │  N/A   │   N/A    │
  │ Orders          │  [ ]   │  [ ]    │  [ ]   │  [ ]   │  [ ]     │
  │ Finance         │  [ ]   │  [ ]    │  [ ]   │  [ ]   │   N/A    │
  │ Admin Panel     │  [ ]   │   N/A   │  N/A   │  N/A   │   N/A    │
  └─────────────────┴────────┴─────────┴────────┴────────┴──────────┘
    ↓
Admin toggles: Orders view=ON, Orders create=ON, Finance=all OFF
    ↓
Each toggle → Server action: upsertRolePermission(roleId, module, action, enabled)
  If enabled=true  → prisma.rolePermission.upsert({ create: {...}, update: {...} })
  If enabled=false → prisma.rolePermission.deleteMany({ where: { roleId, module, action } })
    ↓
Instant effect — any user with this role is immediately affected
```

### Flow 3: Admin Invites a User

```
Admin Panel → Team tab (/admin/team)
    ↓
Clicks "+ Invite Member"
    ↓
Modal:
  - Email: ali@company.com
  - Name: Ali Hassan
  - Role: [Sales Manager ▼]  ← dropdown of existing roles
    ↓
Server action: inviteTeamMember(email, name, roleId)
  → BusinessUser record create with isActive=false (pending)
  → supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { businessId, roleId, name }
    })
    ↓
Ali receives email with invitation link
Ali clicks link → /auth/callback route handles it
    ↓
/app/auth/callback/route.ts:
  → Supabase code exchange → session created
  → Update BusinessUser: isActive=true, lastSeenAt=now()
  → redirect /select-business
    ↓
Ali's dashboard: sidebar filtered by Sales Manager permissions
Finance link NOT visible (because finance.view not in role)
```

### Flow 4: Admin Sets Per-User Permission Override

```
Admin Panel → Team (/admin/team)
    ↓
Row: "Ali Hassan — Sales Manager" → clicks [Perm] button
    ↓
Drawer opens:
  Title: "Ali Hassan — Custom Permissions"
  Subtitle: "Base Role: Sales Manager"
  
  Shows current overrides + add new override UI:
  
  Finance → view   [Base Role: OFF]  Override: [      ] ← toggle
  Orders → delete  [Base Role: ON]   Override: [      ] ← toggle
  
  [+ Add Override for another module]
    ↓
Admin toggles Finance → view = GRANT
    ↓
Server action: upsertPermissionOverride(businessId, userId, "finance", "view", true)
  → prisma.userPermissionOverride.upsert({
      where: { businessId_userId_module_action: {...} },
      create: { businessId, userId, module: "finance", action: "view", granted: true, grantedBy: adminId },
      update: { granted: true }
    })
    ↓
Admin toggles Orders → delete = DENY
    ↓
Server action: upsertPermissionOverride(businessId, userId, "orders", "delete", false)
    ↓
Ali now:
  - Can view Finance P&L (override grant)
  - Cannot delete orders (override deny — even though role allows it)
  - All other Sales Manager permissions unchanged
```

### Flow 5: Runtime Permission Check (Every Action)

```
Ali clicks "Delete Order" button
    ↓
CLIENT SIDE (UX layer):
<PermissionGate module="orders" action="delete">
  <Button>Delete</Button>  ← component
</PermissionGate>

usePermissions() hook → hasPermission("orders", "delete") → false
→ Button does NOT render — Ali never sees the button
    ↓
If bypass attempt (direct URL or API call):
    ↓
SERVER ACTION: deleteOrder(orderId) called
    ↓
const ctx = await getBusinessContext()
// → Supabase getUser() → userId
// → cookies().get("active-business-id") → businessId
// → prisma.businessUser.findUnique({ 
//     where: { businessId_userId },
//     include: { role: { include: { permissions: true } }, overrides: true }
//   })
// → throws if !isActive or not found
    ↓
await hasPermission(ctx, "orders", "delete")
// Step 1: ctx.role.isSystem? → false (Sales Manager)
// Step 2: override found? { module:"orders", action:"delete", granted:false } → YES
// → return false
    ↓
throw new Error("FORBIDDEN: Cannot delete orders")
→ Client shows error toast
    ↓
If permission WAS granted:
prisma.order.delete({ where: { id: orderId, businessId: ctx.businessId } })
// businessId in WHERE = data isolation — cannot delete other business's data
    ↓
await logAudit(ctx, "DELETE", "orders", orderId, `Deleted Order ORD-2026-0042`)
revalidatePath("/sales/orders")
return { success: true }
```

---

## SECTION 4 — PHASE 10: IMPLEMENTATION STEPS

### Step 10.1 — Prisma Schema Changes

**10.1.1 — Business model** → Add to `prisma/schema.prisma` (full model above in Section 2.3)

**10.1.2 — Role + RolePermission models** → Add to `prisma/schema.prisma`

**10.1.3 — BusinessUser model** → Add to `prisma/schema.prisma`

**10.1.4 — UserPermissionOverride model** → Add to `prisma/schema.prisma`

**10.1.5 — AuditLog model upgrade** → Edit existing model in `prisma/schema.prisma` (add businessId, userName, module, entityName, description)

**10.1.6 — Add businessId to all 20 models** → Optional String? first, then required String after seed

**10.1.7 — Run migration + seed:**
```bash
npx prisma db push
npx prisma generate
npx ts-node prisma/seed.ts
```

**Seed script logic — `prisma/seed.ts`:**
```typescript
async function main() {
  // 1. Create default Safcha business
  const business = await prisma.business.create({
    data: { name: 'Safcha', slug: 'safcha', currency: 'SAR', timezone: 'Asia/Riyadh' }
  })

  // 2. Create OWNER role with isSystem=true
  const ownerRole = await prisma.role.create({
    data: { businessId: business.id, name: 'OWNER', isSystem: true, color: '#C9A84C' }
  })

  // 3. Create ALL permissions for OWNER
  const allPerms = []
  for (const mod of MODULES_CONFIG) {
    for (const action of mod.actions) {
      allPerms.push({ roleId: ownerRole.id, module: mod.key, action })
    }
  }
  await prisma.rolePermission.createMany({ data: allPerms })

  // 4. Create BusinessUser for Aziz (get his Supabase userId from auth)
  const AZIZ_SUPABASE_USER_ID = process.env.OWNER_USER_ID // set in .env
  await prisma.businessUser.create({
    data: {
      businessId: business.id,
      userId: AZIZ_SUPABASE_USER_ID,
      email: 'aziz@safcha.com',
      name: 'Aziz',
      roleId: ownerRole.id,
      isActive: true,
    }
  })

  // 5. Update ALL existing records with businessId
  await prisma.product.updateMany({ data: { businessId: business.id } })
  await prisma.category.updateMany({ data: { businessId: business.id } })
  await prisma.order.updateMany({ data: { businessId: business.id } })
  // ... repeat for all 20 models
}
```

---

### Step 10.2 — Supabase Auth Setup

**Install:**
```bash
npm install @supabase/ssr @supabase/supabase-js
```

**Add to `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # NEVER expose to client — server only
OWNER_USER_ID=uuid-of-aziz-in-supabase-auth  # for seed.ts
```

**Create `lib/supabase/client.ts`** — browser-side:
```typescript
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Create `lib/supabase/server.ts`** — server components/actions:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}
```

**Create `lib/supabase/admin.ts`** — invite users (service role):
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Create `middleware.ts` (project root):**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes — no auth needed
  const publicRoutes = ['/login', '/auth/callback', '/onboarding']
  if (publicRoutes.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Check session
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  // Check business cookie
  const businessId = request.cookies.get('active-business-id')?.value
  if (!businessId && pathname !== '/select-business') {
    return NextResponse.redirect(new URL('/select-business', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

**Create `app/login/page.tsx`:**
- No sidebar, no header
- Design: `bg-[var(--background)]` → dark mode = `#0F0F1A`, light mode = `#F5F5F0`
- Centered card: `bg-card border border-border rounded-xl`
- Safcha gold logo: `text-[var(--accent-gold)]` — `#E8A838`
- Email + Password fields
- On success: `router.push('/select-business')`
- Error handling: wrong password, unverified, network

**Create `app/auth/callback/route.ts`:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = createServerClient(...)
    await supabase.auth.exchangeCodeForSession(code)
    // Update BusinessUser.isActive = true
    // redirect to /select-business
  }
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

---

### Step 10.3 — Business Context

**Create `app/onboarding/page.tsx`:**
- Triggered when: session exists but no BusinessUser found for userId
- Fields: Business Name, Industry, Currency (SAR default), Timezone
- Server action: `createBusinessWithOwner()` — creates Business + OWNER Role + all OWNER permissions + BusinessUser in `$transaction`
- After: set `active-business-id` cookie → redirect `/dashboard`

**Create `app/select-business/page.tsx`:**
```typescript
// Server component
const businessUsers = await prisma.businessUser.findMany({
  where: { userId, isActive: true },
  include: { business: true, role: true }
})

// Logic:
if (businessUsers.length === 0) → show "Contact admin" page
if (businessUsers.length === 1) → set cookie → redirect /dashboard  
if (businessUsers.length >= 2) → show selection cards UI
```

**Create `lib/getBusinessContext.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function getBusinessContext() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')

  const businessId = cookies().get('active-business-id')?.value
  if (!businessId) throw new Error('NO_BUSINESS_SELECTED')

  const businessUser = await prisma.businessUser.findUnique({
    where: { businessId_userId: { businessId, userId: user.id } },
    include: {
      role: { include: { permissions: true } },
      overrides: true,
      business: { select: { name: true, currency: true } }
    }
  })

  if (!businessUser) throw new Error('ACCESS_DENIED')
  if (!businessUser.isActive) throw new Error('ACCESS_REVOKED')

  return {
    userId: user.id,
    userName: businessUser.name,
    businessId,
    businessName: businessUser.business.name,
    role: businessUser.role,
    overrides: businessUser.overrides,
  }
}
```

---

### Step 10.4 — RBAC Implementation

**`lib/permissions.ts`** — full code in Section 2.6 above

**`components/auth/PermissionGate.tsx`:**
```tsx
'use client'
import { usePermissions } from '@/lib/hooks/usePermissions'

interface Props {
  module: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode  // Optional — show something else if no permission
}

export function PermissionGate({ module, action, children, fallback = null }: Props) {
  const { can } = usePermissions()
  return can(module, action) ? <>{children}</> : <>{fallback}</>
}

// Usage:
// <PermissionGate module="orders" action="delete">
//   <Button variant="destructive">Delete</Button>
// </PermissionGate>
```

**`lib/hooks/usePermissions.ts`:**
```typescript
'use client'
import { useAppStore } from '@/stores/appStore'  // extend this store with permissions
import { hasPermission } from '@/lib/permissions'

export function usePermissions() {
  const { userPermissions } = useAppStore()  // loaded on app init
  
  return {
    can: (module: string, action: string): boolean => {
      return hasPermission(userPermissions, module, action)
    }
  }
}
```

**Update `Sidebar.tsx` (existing file at `components/layout/Sidebar.tsx`):**

The current navigation array in Sidebar.tsx is hardcoded. Add permission key to each item:
```typescript
const navigation = [
  { name: t.overview, href: '/', icon: LayoutDashboard, permission: { module: 'dashboard', action: 'view' } },
  { name: t.salesOrders, href: '/sales', icon: ShoppingCart, permission: { module: 'orders', action: 'view' }, children: [...] },
  // ... all items
  // Admin Panel — at very bottom, after divider:
  { name: 'Admin Panel', href: '/admin', icon: ShieldCheck, permission: { module: 'admin', action: 'view' } },
]

// In render: filter by permission
const filteredNav = navigation.filter(item => 
  !item.permission || can(item.permission.module, item.permission.action)
)
```

**Update all 17 existing server action files** to add:
```typescript
// PATTERN — add to TOP of every server action function:
export async function createOrder(data: FormData) {
  const ctx = await getBusinessContext()
  if (!await hasPermission(ctx, 'orders', 'create')) throw new Error('FORBIDDEN')
  
  // All Prisma queries: add WHERE businessId: ctx.businessId
  await prisma.order.create({
    data: {
      ...orderData,
      businessId: ctx.businessId,  // ADD THIS
    }
  })
  
  await logAudit(ctx, 'CREATE', 'orders', newOrder.id, `Created order ${newOrder.orderNumber}`)
  revalidatePath('/sales/orders')
}
```

**Action files to update (17 existing):**
```
app/actions/dashboard.ts
app/actions/product/actions.ts
app/actions/pricing.ts
app/actions/suppliers.ts
app/actions/production.ts
app/actions/sales/orders.ts
app/actions/sales/update-order-status.ts
app/actions/sales/invoices.ts
app/actions/sales/utils.ts
app/actions/inventory/raw-materials.ts
app/actions/inventory/finished-products.ts
app/actions/inventory/stock-movements.ts
app/actions/crm/companies.ts
app/actions/crm/contacts.ts
app/actions/crm/deals.ts
app/actions/finance/expenses.ts
app/actions/globalSearch.ts
```

---

### Step 10.5 — Admin Panel

**`app/admin/layout.tsx`:**
```typescript
// Guard: admin.view permission required
const ctx = await getBusinessContext()
if (!await hasPermission(ctx, 'admin', 'view')) redirect('/dashboard')
// Renders: same sidebar + header + "Admin Mode" gold badge in header
```

**`app/admin/roles/page.tsx`** — Roles list:
```
Shows all roles for businessId
Each role card: Name + color badge + user count + [Edit Permissions] button
OWNER card: protected — no edit/delete
"+ New Role" → modal → createRole(name, color)
```

**`app/admin/roles/[id]/page.tsx`** — Permission toggles:
```
Title: "{Role Name} — Edit Permissions"
Grid: Modules (rows) × Actions (columns)
Each cell: Toggle (on/off) — N/A if action doesn't apply to module
Toggle click → upsertRolePermission() server action
Instant effect on all users with this role
```

**`app/admin/team/page.tsx`** — Team Members:
```
Table: Name | Email | Role | Status | Joined | Actions
OWNER row: protected (no change role / deactivate)
Other rows: [Change Role dropdown] [Perm] [Deactivate]
"+ Invite Member" → modal (Email, Name, Role dropdown)
```

**`app/admin/team/page.tsx` — Per-User Override Drawer:**
```
Trigger: [Perm] button
Shows: user's base role permissions list (read-only display)
Override section: module dropdown + action dropdown + grant/deny toggle
Existing overrides: list with delete button
[Reset All Overrides] button → deleteMany all overrides for this user
```

**`app/admin/audit/page.tsx`** — Audit Log:
```
Table: Timestamp | User | Module | Action | Entity | Description
Filters: Module dropdown, User dropdown, Date range picker, Action type
Pagination: server-side, 50 per page
```

**New server action files for admin:**
```
app/actions/auth/business.ts     → createBusinessWithOwner, updateBusiness
app/actions/auth/users.ts        → inviteTeamMember, updateMemberRole, deactivateMember
app/actions/auth/permissions.ts  → upsertRolePermission, deleteRolePermission, 
                                   upsertPermissionOverride, resetUserOverrides
```

**`lib/logAudit.ts`:**
```typescript
export async function logAudit(
  ctx: PermissionContext,
  action: string,
  module: string,
  entityId: string,
  description: string,
  details?: { before?: unknown, after?: unknown }
) {
  await prisma.auditLog.create({
    data: {
      businessId: ctx.businessId,
      userId: ctx.userId,
      userName: ctx.userName,
      action,     // "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"
      module,     // "orders", "products", "users"
      entityId,   // The record ID
      entity: module,
      description,
      details: details ? JSON.stringify(details) : undefined,
    }
  })
}

// Call logAudit() after:
// - Order create/update/delete/status change
// - Product create/update/delete
// - User invite/role change/deactivate
// - Permission override set/reset
// - Batch status change
// - Expense create/delete
```

---

## SECTION 5 — PHASE 11: PERFORMANCE FIXES

### 5.1 — N+1 Query Fixes

**Problem locations:**
- `app/actions/sales/orders.ts` — `getOrders()` — fetches orders then per-row client query
- `app/actions/crm/companies.ts` — `getCompanies()` — per-row pricingTiers query
- `app/actions/production.ts` — `getBatches()` — per-row product query

**Fix pattern:**
```typescript
// BEFORE (N+1 — slow with large data):
const orders = await prisma.order.findMany({ where: { businessId } })
// Then loop and fetch client per order...

// AFTER (single query with includes):
const orders = await prisma.order.findMany({
  where: { businessId },
  include: {
    client: { select: { id: true, name: true, email: true, phone: true } },
    company: { select: { id: true, name: true } },
    invoice: { select: { id: true, invoiceNumber: true, status: true } },
    _count: { select: { orderItems: true } }
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: (page - 1) * 20,
})
```

### 5.2 — Prisma Indexes to Add

```prisma
// Add to Order model:
@@index([businessId, status])
@@index([businessId, createdAt])

// Add to Transaction model:
@@index([businessId, type, date])

// Add to StockMovement model:
@@index([businessId, date])

// Add to AuditLog model:
@@index([businessId, createdAt])
@@index([businessId, userId])

// Add to new models (when created):
// Campaign: @@index([businessId, status])
// Task:     @@index([businessId, status]), @@index([businessId, assigneeId])
// Document: @@index([businessId, category])
```

### 5.3 — Dashboard Parallel Queries

**File: `app/actions/dashboard.ts`**
```typescript
// BEFORE: Sequential ~800ms
// AFTER: Parallel ~150ms
export async function getDashboardData(businessId: string) {
  const [revenue, expenses, orders, inventory, clients, recentActivity] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: 'revenue', businessId }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'expense', businessId }, _sum: { amount: true } }),
    prisma.order.count({ where: { businessId } }),
    prisma.finishedProduct.aggregate({ where: { businessId }, _sum: { currentStock: true } }),
    prisma.client.count({ where: { businessId, deletedAt: null } }),
    getRecentActivity(businessId),
  ])
  // ...
}
```

### 5.4 — Loading Skeletons

**Create `components/ui/TableSkeleton.tsx`:**
- Shimmer animation using CSS variables: `bg-muted` with shimmer overlay
- Props: `rows?: number` (default 8)
- Dark mode: shimmer visible | Light mode: shimmer visible

**Add `loading.tsx` to these folders:**
```
app/sales/orders/loading.tsx
app/crm/contacts/loading.tsx
app/crm/companies/loading.tsx
app/inventory/raw-materials/loading.tsx
app/inventory/finished/loading.tsx
app/production/batches/loading.tsx
app/finance/loading.tsx
app/page.tsx → app/loading.tsx  (dashboard)
```

### 5.5 — Error Boundaries

**Create `components/ui/ErrorState.tsx`:**
- Props: `error: Error, reset: () => void`
- Design: `bg-card border border-destructive rounded-xl` — theme-aware
- "Try Again" button calls `reset()`

**Add `error.tsx` to:** same folders as loading.tsx above

### 5.6 — Server-Side Pagination

**Pattern (add to all DataTable pages):**
```typescript
// URL: /sales/orders?page=1&limit=20
// Server component:
const page = Number(searchParams.page) || 1
const limit = 20
const skip = (page - 1) * limit

const [orders, total] = await Promise.all([
  prisma.order.findMany({ where: { businessId }, skip, take: limit, ... }),
  prisma.order.count({ where: { businessId } })
])

const totalPages = Math.ceil(total / limit)
```

---

## SECTION 6 — PHASE 12: EXTRA MODULES

### 6.0 — Invoice PDF (jsPDF — already installed)

**File: `lib/generateInvoicePDF.ts`**

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generateInvoicePDF(orderId: string, businessId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId, businessId },
    include: {
      client: true,
      company: true,
      invoice: true,
      orderItems: { include: { product: true } }
    }
  })
  
  const doc = new jsPDF()
  
  // Header: Safcha logo text (gold), Invoice # (right)
  // Bill From / Bill To sections
  // Line items table: Product | Qty | Unit Price | Discount | Total
  // Totals: Subtotal, VAT 15%, Shipping, Grand Total
  // Footer: Bank details, Payment terms
  
  // PDF always white background regardless of app theme
  doc.save(`INV-${order.invoice.invoiceNumber}.pdf`)
}
```

**Trigger:** "Download Invoice" button in `components/sales/OrderDetailDrawer.tsx`

---

### 6.1 — Marketing Module

**New Prisma models (`prisma/schema.prisma`):**
```prisma
model Campaign {
  id           String          @id @default(uuid())
  businessId   String          @map("business_id")
  campaignId   String          @unique @map("campaign_id") // CAM-2026-0001
  name         String
  channel      CampaignChannel
  status       CampaignStatus  @default(DRAFT)
  budget       Decimal         @db.Decimal(10,2)
  spent        Decimal         @default(0) @db.Decimal(10,2)
  startDate    DateTime        @map("start_date")
  endDate      DateTime?       @map("end_date")
  reach        Int?
  clicks       Int?            @default(0)
  leads        Int?            @default(0)
  conversions  Int?            @default(0)
  revenue      Decimal?        @db.Decimal(10,2)
  notes        String?         @db.Text
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")
  
  business     Business        @relation(...)
  
  @@index([businessId, status])
  @@map("campaigns")
}

enum CampaignChannel { INSTAGRAM TIKTOK SNAPCHAT GOOGLE_ADS EMAIL SMS WHATSAPP EVENT INFLUENCER OTHER }
enum CampaignStatus  { DRAFT ACTIVE PAUSED COMPLETED CANCELLED }
```

**New files:**
```
app/marketing/page.tsx                          ← KPIs + DataTable
app/marketing/[id]/page.tsx                     ← Campaign detail
components/marketing/NewCampaignModal.tsx
components/marketing/CampaignDetailDrawer.tsx
app/actions/marketing/campaigns.ts              ← getCampaigns, createCampaign, updateCampaign, deleteCampaign
```

**KPIs on overview page:**
- Total Budget | Total Spent | Total Leads | Avg ROI
- ROI formula: `(revenue - spent) / spent × 100`

**Connections:**
- Campaign → Finance: Budget = optional Expense record
- Campaign → CEO Dashboard: "Marketing Spend" KPI

---

### 6.2 — Events & Expos Module

**New Prisma models:**
```prisma
model Event {
  id           String      @id @default(uuid())
  businessId   String      @map("business_id")
  eventId      String      @unique @map("event_id")  // EVT-2026-0001
  name         String
  type         EventType
  status       EventStatus @default(PLANNING)
  venue        String?
  city         String?
  country      String      @default("SA")
  startDate    DateTime    @map("start_date")
  endDate      DateTime?   @map("end_date")
  budget       Decimal?    @db.Decimal(10,2)
  actualCost   Decimal?    @map("actual_cost") @db.Decimal(10,2)
  boothNumber  String?     @map("booth_number")
  notes        String?     @db.Text
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")
  
  business     Business    @relation(...)
  leads        EventLead[]
  inventory    EventInventoryItem[]
  
  @@index([businessId, startDate])
  @@map("events")
}

model EventLead {
  id                String   @id @default(uuid())
  businessId        String   @map("business_id")
  eventId           String   @map("event_id")
  name              String
  phone             String?
  email             String?
  company           String?
  productInterest   String?  @map("product_interest")
  notes             String?  @db.Text
  converted         Boolean  @default(false)
  convertedClientId String?  @map("converted_client_id")
  capturedAt        DateTime @default(now()) @map("captured_at")
  
  event             Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@index([eventId])
  @@map("event_leads")
}

model EventInventoryItem {
  id         String @id @default(uuid())
  businessId String @map("business_id")
  eventId    String @map("event_id")
  name       String
  quantity   Int    // Taken to event
  used       Int    @default(0)
  returned   Int    @default(0)
  
  event      Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@map("event_inventory_items")
}

enum EventType   { EXPO TRADE_SHOW POPUP_STORE SAMPLING_EVENT ONLINE_WEBINAR CORPORATE_VISIT OTHER }
enum EventStatus { PLANNING CONFIRMED ACTIVE COMPLETED CANCELLED }
```

**New files:**
```
app/events/page.tsx                             ← Events list
app/events/[id]/page.tsx                        ← 3 tabs (Overview | Inventory | Leads)
components/events/NewEventModal.tsx
components/events/LeadCaptureForm.tsx           ← Mobile-friendly, big fields
components/events/EventStatusBadge.tsx
app/actions/events/events.ts                    ← CRUD
app/actions/events/leads.ts                     ← captureEventLead, convertLeadToClient
app/actions/events/inventory.ts                 ← addItem, updateUsed
```

**Lead → CRM Conversion:**
```typescript
// app/actions/events/leads.ts
export async function convertLeadToClient(leadId: string) {
  const ctx = await getBusinessContext()
  if (!await hasPermission(ctx, 'crm', 'create')) throw new Error('FORBIDDEN')
  
  const lead = await prisma.eventLead.findUnique({ where: { id: leadId, businessId: ctx.businessId } })
  
  const [newClient] = await prisma.$transaction([
    prisma.client.create({
      data: {
        businessId: ctx.businessId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        type: 'lead',
        source: 'event',
        notes: `Converted from event lead. Interest: ${lead.productInterest}`,
      }
    }),
    prisma.eventLead.update({
      where: { id: leadId },
      data: { converted: true, convertedClientId: newClient.id }
    })
  ])
  
  await logAudit(ctx, 'CREATE', 'crm', newClient.id, `Lead converted from event`)
  revalidatePath('/crm/contacts')
  revalidatePath(`/events/${lead.eventId}`)
}
```

---

### 6.3 — Team & Tasks Module

**New Prisma models:**
```prisma
model Task {
  id            String       @id @default(uuid())
  businessId    String       @map("business_id")
  taskId        String       @unique @map("task_id")  // TSK-2026-0001
  title         String
  description   String?      @db.Text
  status        TaskStatus   @default(TODO)
  priority      TaskPriority @default(MEDIUM)
  assigneeId    String?      @map("assignee_id")    // BusinessUser.userId
  assigneeName  String?      @map("assignee_name")  // denormalized
  createdById   String       @map("created_by_id")
  createdByName String       @map("created_by_name")
  dueDate       DateTime?    @map("due_date")
  completedAt   DateTime?    @map("completed_at")
  module        String?      // "orders", "production" — linked module
  referenceId   String?      @map("reference_id")   // "ORD-2026-0042"
  tags          String[]     @default([])
  checklist     Json?        // [{ text: "...", done: false }]
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  
  comments      TaskComment[]
  business      Business     @relation(...)
  
  @@index([businessId, status])
  @@index([businessId, assigneeId])
  @@map("tasks")
}

model TaskComment {
  id        String   @id @default(uuid())
  taskId    String   @map("task_id")
  userId    String   @map("user_id")
  userName  String   @map("user_name")
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  @@map("task_comments")
}

enum TaskStatus   { TODO IN_PROGRESS IN_REVIEW DONE CANCELLED }
enum TaskPriority { LOW MEDIUM HIGH URGENT }
```

**New files:**
```
app/team/tasks/page.tsx                         ← Kanban board (5 columns)
app/team/members/page.tsx                       ← Team directory (from BusinessUser)
components/team/TaskKanbanBoard.tsx             ← Uses @hello-pangea/dnd (same as CRM pipeline)
components/team/TaskCard.tsx                    ← Title + priority badge + due date + assignee avatar + checklist count
components/team/TaskDetailDrawer.tsx            ← Full task — checklist items + comments
components/team/NewTaskModal.tsx                ← assignee dropdown from BusinessUser table
app/actions/team/tasks.ts
app/actions/team/comments.ts
```

**Kanban columns:** `TODO | IN_PROGRESS | IN_REVIEW | DONE | CANCELLED`

**Task card priority colors:**
- `URGENT` → `bg-red-100 text-red-700` / dark: `bg-red-900/30 text-red-400`
- `HIGH` → amber
- `MEDIUM` → blue
- `LOW` → gray

---

### 6.4 — Document Vault Module

**Supabase Storage:**
- Bucket: `documents` (one bucket, files stored under `{businessId}/` prefix)
- Access: Private — only via signed URLs generated server-side
- Signed URL expiry: 1 hour

**New Prisma model:**
```prisma
model Document {
  id             String           @id @default(uuid())
  businessId     String           @map("business_id")
  docId          String           @unique @map("doc_id")  // DOC-2026-0001
  name           String
  description    String?          @db.Text
  category       DocumentCategory
  filePath       String           @map("file_path")   // "{businessId}/{docId}/{filename}"
  fileName       String           @map("file_name")
  fileSize       Int              @map("file_size")   // bytes
  mimeType       String           @map("mime_type")
  tags           String[]         @default([])
  isConfidential Boolean          @default(false) @map("is_confidential")
  expiresAt      DateTime?        @map("expires_at")  // For certs/contracts
  uploadedById   String           @map("uploaded_by_id")
  uploadedByName String           @map("uploaded_by_name")
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")
  
  business       Business         @relation(...)
  
  @@index([businessId, category])
  @@index([businessId, createdAt])
  @@map("documents")
}

enum DocumentCategory {
  CONTRACT CERTIFICATE SOP LEGAL FINANCIAL HR PRODUCT MARKETING OTHER
}
```

**New files:**
```
app/documents/page.tsx                          ← Grid view with category filter tabs
components/documents/DocumentGrid.tsx           ← Grid/list toggle
components/documents/DocumentCard.tsx           ← Icon + name + category badge + size + expiry warning
components/documents/UploadDocumentModal.tsx    ← Drag-drop zone + fields
app/actions/documents/documents.ts             ← uploadDocument, deleteDocument, getDocuments, getSignedUrl
```

**Upload flow:**
```typescript
// 1. Client: File drag-drop → base64 or FormData
// 2. Server action: uploadDocument(file, name, category, ...)
//    → supabaseAdmin.storage.from('documents').upload(`${businessId}/${docId}/${filename}`, file)
//    → prisma.document.create({ ...metadata, filePath, businessId })
// 3. Revalidate page
```

**View/Download:**
```typescript
// Server action: getSignedUrl(filePath, businessId)
// → supabaseAdmin.storage.from('documents').createSignedUrl(filePath, 3600)
// → returns URL valid for 1 hour
// → client opens in new tab
```

**Confidential docs:** `isConfidential=true` → only users with `admin.view` permission can see

---

### 6.5 — Strategy Module

**New Prisma models:**
```prisma
model Strategy {
  id          String       @id @default(uuid())
  businessId  String       @map("business_id")
  title       String
  year        Int
  quarter     Int?         // 1-4, null = annual
  type        StrategyType
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")
  
  objectives  Objective[]
  business    Business     @relation(...)
  
  @@map("strategies")
}

model Objective {
  id          String    @id @default(uuid())
  strategyId  String    @map("strategy_id")
  businessId  String    @map("business_id")
  title       String
  description String?   @db.Text
  owner       String?
  dueDate     DateTime? @map("due_date")
  progress    Int       @default(0)   // 0-100, auto-calculated from KRs
  status      OKRStatus @default(ON_TRACK)
  
  keyResults  KeyResult[]
  strategy    Strategy  @relation(fields: [strategyId], references: [id], onDelete: Cascade)
  
  @@map("objectives")
}

model KeyResult {
  id           String    @id @default(uuid())
  objectiveId  String    @map("objective_id")
  businessId   String    @map("business_id")
  title        String
  targetValue  Decimal   @map("target_value") @db.Decimal(10,2)
  currentValue Decimal   @default(0) @map("current_value") @db.Decimal(10,2)
  unit         String    // "SAR", "%", "units", "clients", "kg"
  status       OKRStatus @default(ON_TRACK)
  
  objective    Objective @relation(fields: [objectiveId], references: [id], onDelete: Cascade)
  
  @@map("key_results")
}

enum StrategyType { ANNUAL_PLAN QUARTERLY_OKR PRODUCT_ROADMAP MARKET_EXPANSION FINANCIAL_TARGET }
enum OKRStatus    { ON_TRACK AT_RISK BEHIND COMPLETED CANCELLED }
```

**New files:**
```
app/strategy/page.tsx                           ← OKR tree view
components/strategy/OKRTree.tsx                 ← Expandable tree
components/strategy/ProgressBar.tsx             ← Gold fill with status color
components/strategy/NewStrategyModal.tsx
components/strategy/NewObjectiveModal.tsx
app/actions/strategy/okr.ts
```

---

### 6.6 — Settings Module (Expanded)

**New pages:**
```
app/settings/general/page.tsx      ← Business name, timezone, currency (from Business model)
app/settings/production/page.tsx   ← ProductionCapacity (move existing SystemSettings here)
app/settings/notifications/page.tsx ← Per-user email alert preferences
```

---

## SECTION 7 — DARK/LIGHT THEME RULES

### 7.1 — Actual CSS Variables (from `app/globals.css`)

```css
/* Light mode */
[data-theme="light"] {
  --accent-gold: #E8A838;
  --background: #F5F5F0;
  --card: #FFFFFF;
  --foreground: #333333;
  --border: #E0E0E0;
  --muted-foreground: #757575;
  --sidebar: #1A1A2E;   /* Sidebar ALWAYS dark */
  --success: #2D6A4F;
  --error: #D32F2F;
  --warning: #E8A838;
}

/* Dark mode */
[data-theme="dark"] {
  --accent-gold: #E8A838;
  --background: #0F0F1A;
  --card: #1A1A2E;
  --foreground: #F5F5F0;
  --border: #2A2A3E;
  --muted-foreground: #A0A0A0;
  --sidebar: #0A0A14;   /* Sidebar even darker in dark mode */
  --success: #4ADE80;
  --error: #F87171;
  --warning: #FBBF24;
}
```

### 7.2 — Rules for Every New Component

```tsx
// ✅ CORRECT — works in both themes
<div className="bg-card border border-border text-foreground rounded-lg p-4">
  <h2 className="text-foreground font-semibold">Title</h2>
  <p className="text-muted-foreground">Subtitle</p>
  <button className="bg-[var(--accent-gold)] text-black">Action</button>
</div>

// ❌ WRONG — breaks in light mode
<div className="bg-[#1A1A2E] text-white border-[#2A2A3E]">
```

**Rules:**
- CSS variables ONLY — never hardcode colors
- Sidebar stays dark in both modes — use `var(--sidebar)` not `bg-card`
- `var(--accent-gold)` = `#E8A838` — use for primary actions, active states, badges
- Test BOTH themes for every new component before marking done

**New module badge colors (add to `app/globals.css`):**
```css
:root {
  --marketing-color: #8B5CF6;
  --events-color: #3B82F6;
  --tasks-color: #F59E0B;
  --documents-color: #6366F1;
  --strategy-color: #10B981;
}
```

---

## SECTION 8 — COMPLETE CONNECTION MAP

### 8.1 — All Database Relations

```
BUSINESS (central hub — businessId on every single table)
│
├── AUTH LAYER
│   ├── BusinessUser (Supabase userId ↔ Prisma BusinessUser)
│   ├── Role → RolePermission (module+action — admin toggles)
│   └── UserPermissionOverride (per-user grant/deny — overrides role)
│
├── PRODUCT CATALOG
│   ├── Category → Products, PricingTiers
│   ├── Product → PricingTiers (1:many), ProductionBatches (1:many),
│   │            OrderItems (1:many), FinishedProduct (1:1)
│   └── Supplier → RawMaterials (1:many)
│
├── CRM
│   ├── Company → Clients (1:many), Deals (1:many), Orders (1:many),
│   │            CompanyPricingTier (per category pricing)
│   ├── Client → Deals (1:many), Orders (1:many)
│   └── Deal (7-stage kanban — Company+Client linked)
│
├── SALES
│   ├── Order → Client (many:1), Company (many:1, optional), Deal (many:1, optional),
│   │          OrderItems (1:many), Invoice (1:1)
│   └── OrderItem → Order (many:1), Product (many:1)
│
├── INVENTORY
│   ├── RawMaterial → StockMovements (1:many), Supplier (many:1), [BatchItems via materialName]
│   └── FinishedProduct → Product (1:1), StockMovements (1:many)
│
├── PRODUCTION
│   ├── ProductionBatch → Product (many:1), BatchItems (1:many), QualityChecks (1:many)
│   └── BatchItem → ProductionBatch (many:1), [RawMaterial optional FK]
│
├── FINANCE
│   ├── Transaction (auto-created when Order→delivered, or when Expense created)
│   └── Expense → Transaction (1:1 linked, synced create/update/delete)
│
├── MARKETING
│   └── Campaign (standalone — future: link to CRM via lead source)
│
├── EVENTS
│   ├── Event → EventLeads (1:many), EventInventoryItems (1:many)
│   └── EventLead → Client (optional — set when converted)
│
├── TASKS
│   ├── Task → BusinessUser (assignee — by userId, not FK), TaskComments (1:many)
│   └── Task.module + Task.referenceId → soft link to Order/Batch/etc.
│
├── DOCUMENTS
│   └── Document → Supabase Storage (via filePath)
│
├── STRATEGY
│   └── Strategy → Objectives (1:many) → KeyResults (1:many)
│
└── AUDIT
    └── AuditLog (all create/update/delete/status-change actions from all modules)
```

### 8.2 — Cross-Module Automation Flows

```
FLOW 1: Order-to-Cash (Phases 4+6+8 — already implemented)
─────────────────────────────────────────────────────────
Order.draft → Order.confirmed:
  FinishedProduct.reservedStock += OrderItem.quantity (per item)
  Invoice auto-created (INV-YYYY-XXXX)

Order.confirmed → Order.shipped:
  FinishedProduct.reservedStock -= quantity
  FinishedProduct.currentStock -= quantity
  StockMovement(STOCK_OUT, ORDER_FULFILLMENT) created per item

Order.shipped → Order.delivered:
  Transaction(type:revenue, amount:grandTotal) auto-created
  referenceId = orderNumber

Order.any → Order.cancelled (if was confirmed/processing):
  FinishedProduct.reservedStock -= quantity (rollback)

All above: wrapped in prisma.$transaction()


FLOW 2: Production-to-Inventory (Phase 7 — already implemented)
───────────────────────────────────────────────────────────────
QC submitted → all 5 checks pass:
  ProductionBatch.status → completed
  FinishedProduct.currentStock += batch.actualQty
  StockMovement(STOCK_IN) created for FinishedProduct
  For each BatchItem:
    RawMaterial.currentStock -= batchItem.quantityUsed
    StockMovement(STOCK_OUT, PRODUCTION_INPUT) created

QC fail (any check fails):
  ProductionBatch.status → failed
  NO inventory changes

All above: prisma.$transaction()


FLOW 3: Expense-to-Finance (Phase 8 — already implemented)
─────────────────────────────────────────────────────────
Expense.create → Transaction(type:expense) auto-create (same $transaction)
Expense.update → Transaction.amount update (same $transaction)
Expense.delete → Transaction.delete (same $transaction)


FLOW 4: Event Lead → CRM (Phase 12 — new)
─────────────────────────────────────────
[Add to CRM] button on EventLead
→ prisma.$transaction([
    prisma.client.create({ businessId, name, phone, email, source: 'event' }),
    prisma.eventLead.update({ converted: true, convertedClientId: newClient.id })
  ])
→ logAudit("CREATE", "crm", ...)
→ revalidatePath


FLOW 5: Permission Check (Phase 10 — new, every action)
───────────────────────────────────────────────────────
Every server action:
  getBusinessContext() → userId + businessId + role + overrides
  hasPermission(ctx, module, action):
    → OWNER? return true
    → override found? return override.granted
    → role permission? return true/false
  throw FORBIDDEN if false
  Execute action with businessId in WHERE clause
  logAudit()
  revalidatePath()
```

### 8.3 — Auth + Business Flow

```
ANY URL VISITED
      ↓
middleware.ts
  No session → /login
  Session + no BusinessUser → /onboarding
  Session + no business cookie → /select-business
  All good → allow request
      ↓
/login
  Supabase signInWithPassword()
  Success → /select-business
      ↓
/select-business
  Query BusinessUser WHERE userId=me
  0 → "Contact Admin"
  1 → set cookie → /dashboard
  2+ → show cards → pick → set cookie → /dashboard
      ↓
/dashboard (and every page)
  getBusinessContext() in server component/action
  Returns: userId, businessId, role+permissions, overrides
  Sidebar filtered by can(module, 'view')
  Admin Panel link: only if can('admin', 'view')
```

---

## SECTION 9 — FINAL FOLDER STRUCTURE

```
safcha-dashboard/
├── app/
│   ├── layout.tsx                         (existing — add auth context load)
│   ├── page.tsx                           (existing CEO Dashboard)
│   ├── loading.tsx                        (NEW)
│   ├── login/
│   │   └── page.tsx                       (NEW — no sidebar/header)
│   ├── onboarding/
│   │   └── page.tsx                       (NEW — first time business setup)
│   ├── select-business/
│   │   └── page.tsx                       (NEW)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                   (NEW — Supabase callback handler)
│   ├── admin/                             (NEW — ADMIN+ only)
│   │   ├── layout.tsx
│   │   ├── roles/
│   │   │   ├── page.tsx                   (roles list + create)
│   │   │   └── [id]/page.tsx              (permission toggles)
│   │   ├── team/
│   │   │   └── page.tsx                   (members + invite + overrides)
│   │   ├── settings/
│   │   │   └── page.tsx                   (business profile)
│   │   └── audit/
│   │       └── page.tsx                   (audit log)
│   ├── sales/orders/                      (existing — add businessId + perms)
│   │   ├── loading.tsx                    (NEW)
│   │   └── error.tsx                      (NEW)
│   ├── crm/                               (existing — add businessId + perms)
│   │   ├── contacts/loading.tsx           (NEW)
│   │   ├── companies/loading.tsx          (NEW)
│   │   └── pipeline/loading.tsx           (NEW)
│   ├── inventory/                         (existing — add businessId + perms)
│   │   ├── raw-materials/loading.tsx      (NEW)
│   │   └── finished/loading.tsx           (NEW)
│   ├── production/                        (existing — add businessId + perms)
│   │   └── batches/loading.tsx            (NEW)
│   ├── finance/                           (existing — add businessId + perms)
│   │   └── loading.tsx                    (NEW)
│   ├── products/                          (existing — add businessId + perms)
│   ├── marketing/                         (NEW)
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── loading.tsx
│   ├── events/                            (NEW)
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── loading.tsx
│   ├── team/                              (NEW — replaces /tasks placeholder)
│   │   ├── tasks/page.tsx
│   │   ├── members/page.tsx
│   │   └── loading.tsx
│   ├── documents/                         (NEW)
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── strategy/                          (NEW — replaces placeholder)
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── settings/                          (EXPANDED)
│   │   ├── general/page.tsx               (NEW)
│   │   ├── production/page.tsx            (moved from existing)
│   │   └── notifications/page.tsx         (NEW)
│   └── actions/
│       ├── auth/                          (NEW)
│       │   ├── business.ts
│       │   ├── users.ts
│       │   └── permissions.ts
│       ├── marketing/campaigns.ts         (NEW)
│       ├── events/events.ts               (NEW)
│       ├── events/leads.ts                (NEW)
│       ├── team/tasks.ts                  (NEW)
│       ├── team/comments.ts               (NEW)
│       ├── documents/documents.ts         (NEW)
│       └── strategy/okr.ts               (NEW)
│
├── components/
│   ├── auth/                              (NEW)
│   │   ├── PermissionGate.tsx
│   │   └── UserAvatar.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx                   (UPDATED — role filtering + admin link)
│   │   └── Header.tsx                    (UPDATED — user menu, logout)
│   ├── ui/
│   │   ├── TableSkeleton.tsx             (NEW)
│   │   └── ErrorState.tsx               (NEW)
│   ├── marketing/                         (NEW)
│   ├── events/                            (NEW)
│   ├── team/                              (NEW)
│   ├── documents/                         (NEW)
│   └── strategy/                          (NEW)
│
├── lib/
│   ├── supabase/                          (NEW)
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── getBusinessContext.ts              (NEW — used in every server action)
│   ├── permissions.ts                     (NEW — hasPermission function)
│   ├── permissions-config.ts              (NEW — MODULES_CONFIG array)
│   ├── logAudit.ts                        (NEW — logAudit helper)
│   ├── generateInvoicePDF.ts             (NEW — jsPDF invoice)
│   ├── exportToCSV.ts                    (NEW — DataTable export)
│   ├── hooks/
│   │   └── usePermissions.ts             (NEW)
│   ├── prisma.ts                          (existing)
│   └── i18n.ts                            (existing — add new module translations)
│
├── stores/
│   └── appStore.ts                        (UPDATE — add userPermissions, currentBusiness)
│
├── middleware.ts                           (NEW — project root, route protection)
│
├── prisma/
│   ├── schema.prisma                      (UPDATED — new models + businessId everywhere)
│   └── seed.ts                            (NEW — default business + OWNER + Aziz)
│
└── types/
    ├── permissions.ts                     (NEW — PermissionContext type)
    └── actions.ts                         (NEW — ActionResult<T> type)
```

---

## SECTION 10 — COMPLETE EXECUTION CHECKLIST

### Phase 10 — Auth + Roles + Permissions

#### Database
- [ ] Business model add to `prisma/schema.prisma`
- [ ] Role model add to `prisma/schema.prisma`
- [ ] RolePermission model add to `prisma/schema.prisma`
- [ ] BusinessUser model add to `prisma/schema.prisma`
- [ ] UserPermissionOverride model add to `prisma/schema.prisma`
- [ ] AuditLog model upgrade (businessId, userName, module, entityName, description)
- [ ] businessId add to all 20 existing models (as String? first)
- [ ] `npx prisma db push` + `npx prisma generate`
- [ ] `prisma/seed.ts` create and run (Safcha business + OWNER role + all perms + Aziz user + update all existing records)
- [ ] Make businessId required (remove ?) + `npx prisma db push` again

#### Supabase Auth
- [ ] `npm install @supabase/ssr @supabase/supabase-js`
- [ ] `lib/supabase/client.ts`, `server.ts`, `admin.ts` create
- [ ] `.env.local` — add SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, OWNER_USER_ID
- [ ] `middleware.ts` — route protection + session check
- [ ] `app/login/page.tsx` — dark design, email+password, no sidebar
- [ ] `app/auth/callback/route.ts` — Supabase callback handler

#### Business + Onboarding
- [ ] `app/onboarding/page.tsx` — first time business create
- [ ] `app/select-business/page.tsx` — 0/1/2+ business logic
- [ ] `lib/getBusinessContext.ts` — server helper
- [ ] `app/actions/auth/business.ts` — createBusinessWithOwner, updateBusiness
- [ ] Update ALL 17 existing server action files (add businessId + permission check)

#### RBAC
- [ ] `lib/permissions-config.ts` — MODULES_CONFIG array
- [ ] `lib/permissions.ts` — hasPermission() function
- [ ] `components/auth/PermissionGate.tsx`
- [ ] `lib/hooks/usePermissions.ts`
- [ ] `components/layout/Sidebar.tsx` — add permission key to each nav item + filter
- [ ] Admin Panel link in Sidebar (bottom, after divider, admin.view only)
- [ ] `lib/logAudit.ts` — logAudit() helper

#### Admin Panel
- [ ] `app/admin/layout.tsx` — admin.view guard
- [ ] `app/admin/roles/page.tsx` — roles list + create modal
- [ ] `app/admin/roles/[id]/page.tsx` — permission toggles grid
- [ ] `app/admin/team/page.tsx` — members list + invite modal
- [ ] Per-user Permission Override drawer (in team page)
- [ ] `app/admin/settings/page.tsx` — business profile
- [ ] `app/admin/audit/page.tsx` — audit log + filters
- [ ] `app/actions/auth/users.ts` — invite, updateRole, deactivate
- [ ] `app/actions/auth/permissions.ts` — upsertRolePermission, upsertOverride, resetOverrides

### Phase 11 — Performance

- [ ] N+1 fix: `app/actions/sales/orders.ts` — include client+company+invoice+_count
- [ ] N+1 fix: `app/actions/crm/companies.ts` — include companyPricingTiers
- [ ] N+1 fix: `app/actions/production.ts` — include product in batches
- [ ] Prisma indexes: Order, Transaction, AuditLog, StockMovement (add @@index)
- [ ] Dashboard `Promise.all()` in `app/actions/dashboard.ts`
- [ ] `components/ui/TableSkeleton.tsx` create (shimmer, CSS variables)
- [ ] `loading.tsx` add: orders, contacts, companies, raw-materials, finished, batches, finance, dashboard
- [ ] `components/ui/ErrorState.tsx` create
- [ ] `error.tsx` add: all module folders
- [ ] Server-side pagination: Orders, Contacts, Companies, Transactions, AuditLog

### Phase 12 — Extra Modules

- [ ] Invoice PDF: `lib/generateInvoicePDF.ts` + "Download Invoice" button in OrderDetailDrawer
- [ ] Campaign model + enums add to schema + migrate
- [ ] Marketing pages: overview + [id] + actions file
- [ ] Event + EventLead + EventInventoryItem models + enums + migrate
- [ ] Events pages: list + [id] (3 tabs) + lead capture + actions
- [ ] Lead → CRM conversion action
- [ ] Task + TaskComment models + enums + migrate
- [ ] Tasks Kanban page (5 columns, @hello-pangea/dnd)
- [ ] Team members directory page (from BusinessUser)
- [ ] Supabase Storage bucket setup (`documents`)
- [ ] Document model + enums + migrate
- [ ] Documents vault page (grid + category tabs + upload modal)
- [ ] Signed URL view/download flow
- [ ] Strategy + Objective + KeyResult models + enums + migrate
- [ ] Strategy OKR tree page
- [ ] Settings: general/page.tsx + notifications/page.tsx
- [ ] `lib/exportToCSV.ts` + Export buttons on all DataTables
- [ ] New module translations in `lib/i18n.ts` (EN + AR)

---

## SECTION 11 — CRITICAL RULES (Never Break)

```
1. getBusinessContext() = FIRST LINE of every server action — no exceptions
2. hasPermission() = AFTER getBusinessContext() — throw FORBIDDEN if false
3. businessId in WHERE = EVERY Prisma findMany/findUnique/update/delete query
4. prisma.$transaction() = EVERY multi-table write (atomicity)
5. logAudit() = AFTER create/update/delete/status-change actions
6. CSS variables ONLY = var(--accent-gold), var(--card) — never hardcode colors
7. Sidebar stays dark in both themes — use var(--sidebar) not bg-card
8. Decimal → Number() = convert in server actions before returning to client
9. revalidatePath() = after every mutation
10. Test BOTH themes = every new component before marking done
11. PROJECT_CONTEXT.md = update after every phase complete
12. New models = schema push + generate + seed existing records with businessId
13. Never use hardcoded user IDs or business IDs in code — always from ctx
14. Supabase SERVICE_ROLE_KEY = server only — NEVER in client code or expose to browser
```

---

*Version 4.0 | March 2026 | Based on: `ameensafcha/Dashboard2` actual codebase*  
*Next action: Start Phase 10.1.1 — Add Business model to `prisma/schema.prisma`*
