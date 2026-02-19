# Safcha Dashboard - Development Plan

## IMPORTANT INSTRUCTIONS - SABSE PEHLE PADHO

1. **HAR BAAR PLAN.MD DEKHO** - Koi bhi task shuru karne se pehle plan.md dekho
2. **JO MARKD [x] HAI WO PURA HO GYA** - Uspe dubara kaam mat karo
3. **JO MARKD [ ] HAI WO BNANA HAI** - Wahi abhi banana hai  
4. **HAR CHIZ BANAKE MARK LGAO** - Ek task complete hone par plan.md update karo aur [ ] ko [x] karo
5. **USER SE PUCHNA** - UI design user se puchna kiaisa dikhega, requirements clear karo
6. **EK EK KARKAR BNAO** - Saare ek saath mat banao, ek ek karke karo
7. **DATABASE KE BAD UI BNAO** - Pehle Prisma schema banao, phir UI banaana
8. **HAR PHASE SE PEHLE USER SE PUCHO** - UI requirements clear karo
9. **SERVER RUN KRO** - Jab bhi project run karna ho to:
   - Kill karne ke liye: `npx kill-port 3050`
   - Project run karo port 3050 pe: `npm run dev -- -p 3050`

## CODE QUALITY RULES

1. **LATEST VERSIONS USE KRO** - Always use latest stable versions of all packages
2. **REUSABLE COMPONENTS BNAO** - Code bar bar mat likho, components create karo aur reuse karo
3. **OPTIMIZED APP** - App fast aur optimized honi chahiye
4. **SHORT & CLEAN CODE** - Clean code likho, unnecessary comments na likho
5. **TYPESCRIPT USE KRO** - Full type safety maintain karo
6. **SHADCN/UI USE KRO** - UI components ke liye shadcn/ui use karo (already installed)
7. **FULLY RESPONSIVE** - Har UI component mobile-friendly honi chahiye
8. **HAR CHEIZ KA RECORD RAKHO** - Jb bhi kuch banao, plan.md mein likho ki user ne kya kaha tha, kis trah ka UI chahiye tha. Sara update plan.md mein reflect hona chahiye.
9. **LANGUAGE SUPPORT** - Har UI ko English aur Arabic (RTL) ke saath banao - language state zustand mein rakho
10. **NOTIFICATIONS** - Notifications system zustand mein implement karo
11. **DARK/LIGHT MODE** - Theme toggle add karo, zustand mein theme state rakho
12. **PERFORMANCE** - Static pages, code splitting, optimized builds
13. **COLOR PALETTE** - Niche diye gaye colors use karo har jagah (plan.md se dekho)

## COLOR PALETTE (HAR JAGAH USE KRO)

```css
--primary: #1A1A2E          /* Sidebar, headers - DARK */
--primary-foreground: #ffffff
--accent-gold: #E8A838      /* CTAs, highlights, active states */
--accent-gold-foreground: #000000
--accent-green: #2D6A4F     /* Success states, positive metrics */
--accent-green-foreground: #ffffff
--accent-red: #D32F2F       /* Alerts, negative metrics, low stock */
--accent-red-foreground: #ffffff
--bg-main: #F5F5F0          /* Main background - LIGHT */
--bg-card: #FFFFFF           /* Card backgrounds */
--bg-sidebar: #1A1A2E       /* Sidebar - DARK */
--text-primary: #333333      /* Body text */
--text-secondary: #757575    /* Labels, captions */
--border: #E0E0E0           /* Card borders, dividers */
--muted: #F5F5F0
--muted-foreground: #757575
```

## LANGUAGE & THEME (ZUSTAND)

- Language state: `useAppStore` mein `language: 'en' | 'ar'`
- Theme state: `useAppStore` mein `theme: 'light' | 'dark'`
- RTL support for Arabic
- Har component mein language aur theme consider karo

---

## Project Overview

- **Project Name:** Safcha Internal Company Dashboard
- **Type:** Full-stack Web Application
- Target: 10-12 weeks
- **Users:** Safcha team (CEO, Operations, Factory, Marketing, etc.)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | Zustand |
| Database | Local PostgreSQL |
| ORM | Prisma 5 (Stable) |
| Authentication | NextAuth.js (local) |
| Charts | Recharts |

---

## Development Order

1. Foundation - Project Setup + Layout Shell ✅ DONE
2. Product Catalog - Products, Variants, Pricing Tiers
3. Production - Batches, QC, R&D
4. Sales & Orders - Orders, Clients, Invoices
5. Inventory - Raw Materials, Finished Products, Stock Movements
6. Finance - Revenue from Orders + Expenses
7. CEO Dashboard - Sab data integrate
8. CRM - Contacts, Companies, Deals
9. Team & Tasks - Tasks, Projects, Directory
10. Marketing - Campaigns, Content
11. Events - Events, Inventory, Leads
12. Documents - Document Vault
13. Strategy - OKRs, Roadmap
14. Settings - Users, Roles, Profile
15. Polish & Launch

---

## Already Built (Track Record)

### Foundation (Phase 1) - COMPLETED
- Next.js 14 project setup - User said: "sab kuch responsive ho"
- Tailwind CSS configured - User said: "sab kuch responsive ho"
- shadcn/ui components installed - User said: "shadcn/ui use kro"
- Prisma 5 setup - User said: "prisma 5 ka stable version chahiye"
- Zustand store - User said: "state zustand rkho"
- Dark sidebar (#1A1A2E) - User said: "dark theme chahiye"
- Header with search/notifications - User said: "search aur notifications chahiye"
- Routes structure - User said: "sare modules chahiye"
- KPICard component - User said: "reusable components bnao, responsive ho"
- PageHeader component - User said: "reusable components bnao"

---

## Phase Breakdown

### Phase 1: Foundation ✅ PURA DONE
- [x] Initialize Next.js 14 project
- [x] Install & configure Tailwind CSS
- [x] Install shadcn/ui components
- [x] Install Prisma 5 and configure PostgreSQL
- [x] Setup Zustand for state management
- [x] Initialize Git repository
- [x] Create sidebar component (dark theme #1A1A2E)
- [x] Create header component
- [x] Setup responsive layout
- [x] Configure routing structure
- [x] Add color tokens

### Phase 2: Product Catalog ✅ COMPLETED
- [x] UI Requirements: List/Grid toggle, 5 items pagination, filters, modals
- [x] Database schema (products, variants, pricing_tiers, suppliers)
- [x] Prisma schema created
- [x] Products list UI (CRUD with list/grid view)
- [x] Products page with pagination (5 items per page)
- [x] Variants page UI
- [x] Pricing tiers page UI
- [x] Suppliers page UI
- [x] Sidebar sub-items added

### Phase 3: Production
- [ ] User se puchna: Production workflow kaisa hai?
- [ ] Design database schema (production_batches, batch_items, quality_checks, rnd_projects)
- [ ] Production batches UI banaana
- [ ] QC checklist UI banaana
- [ ] R&D tracker UI banaana

### Phase 4: Sales & Orders
- [ ] User se puchna: Orders kaisa dikhega? Invoice chahiye?
- [ ] Design database schema (orders, order_items, clients, invoices)
- [ ] Orders list UI banaana
- [ ] Order detail drawer UI banaana
- [ ] Create/Edit order forms UI banaana
- [ ] Clients management UI banaana
- [ ] Invoices UI banaana

### Phase 5: Inventory
- [ ] User se puchna: Stock levels dikhane ka tareeka?
- [ ] Design database schema (raw_materials, finished_products, stock_movements)
- [ ] Raw materials UI banaana
- [ ] Finished products UI banaana
- [ ] Stock movements log UI banaana
- [ ] Low stock alerts UI banaana

### Phase 6: Finance
- [ ] User se puchna: P&L dashboard kaisa dikhega?
- [ ] Design database schema (transactions, expenses, subscriptions)
- [ ] Revenue tracking UI banaana
- [ ] Expense tracking UI banaana
- [ ] P&L dashboard UI banaana

### Phase 7: CEO Dashboard
- [ ] User se puchna: Kaunse KPIs dikhane hain?
- [ ] KPI cards UI banaana
- [ ] Charts UI banaana (Recharts)
- [ ] Activity feed UI banaana
- [ ] Sab data sources connect karna

### Phase 8: CRM
- [ ] User se puchna: Deals pipeline kaisa dikhega? Kanban?
- [ ] Design database schema (contacts, companies, deals, activities, event_leads)
- [ ] Contacts UI banaana
- [ ] Companies UI banaana
- [ ] Deals Kanban pipeline UI banaana

### Phase 9: Team & Tasks
- [ ] User se puchna: Task board kaisa dikhega?
- [ ] Design database schema (projects, tasks, task_comments, task_attachments)
- [ ] Task Kanban board UI banaana
- [ ] Projects UI banaana
- [ ] Team directory UI banaana

### Phase 10: Marketing
- [ ] User se puchna: Campaigns ka data kaisa dikhega?
- [ ] Design database schema (campaigns, content_calendar)
- [ ] Campaign tracker UI banaana
- [ ] Ad budget dashboard UI banaana
- [ ] Content calendar UI banaana

### Phase 11: Events
- [ ] User se puchna: Events kaisa dikhega?
- [ ] Design database schema (events, event_inventory, event_teams)
- [ ] Events management UI banaana
- [ ] Event inventory planning UI banaana

### Phase 12: Documents
- [ ] User se puchna: Documents kaisa organize karna hai?
- [ ] Design database schema (document_categories, documents)
- [ ] Document vault UI banaana
- [ ] File upload UI banaana

### Phase 13: Strategy
- [ ] User se puchna: OKRs kaisa dikhega?
- [ ] Design database schema (okrs, key_results, roadmap_initiatives, investor_relations)
- [ ] OKRs tracker UI banaana
- [ ] Roadmap visualization UI banaana

### Phase 14: Settings
- [ ] User se puchna: Kaunse settings chahiye?
- [ ] Design database schema (company_settings, audit_logs, notifications)
- [ ] User management UI banaana
- [ ] Role & permissions UI banaana
- [ ] Company profile UI banaana

### Phase 15: Polish & Launch
- [ ] Global search (Cmd+K) implement karna
- [ ] Notifications system implement karna
- [ ] Arabic language support (RTL) implement karna
- [ ] Language toggle (EN/AR) implement karna
- [ ] Mobile responsiveness check karna
- [ ] Performance optimization karna
- Arabic language support (RTL)
- Language toggle (EN/AR)
- Mobile responsiveness
- Performance optimization
- UAT & Deployment

---

## Detailed Database Schema with Relations

### 1. Users & Authentication
```
Table: users
- id: UUID (PK)
- name: String
- email: String (unique)
- password_hash: String
- avatar: String (nullable)
- role: String (ceo/admin/operations/factory/marketing/viewer)
- department: String (nullable)
- phone: String (nullable)
- is_active: Boolean (default true)
- created_at: DateTime
- updated_at: DateTime

Table: roles
- id: UUID (PK)
- name: String (unique)
- description: String
- permissions: JSON
```

### 2. Product Catalog (SABSE PEHLE)
```
Table: products
- id: UUID (PK)
- name: String
- category: String (pure_safcha/ceremonial_blend/flavored_blend/karak/palm_dye/specialty)
- sku_prefix: String
- description: Text (nullable)
- key_ingredients: String (nullable)
- caffeine_free: Boolean (default true)
- sfda_status: String (approved/pending/not_submitted)
- sfda_reference: String (nullable)
- base_cost: Decimal
- base_retail_price: Decimal
- image: String (nullable)
- status: String (active/in_development/discontinued)
- launch_date: Date (nullable)
- created_at: DateTime
- updated_at: DateTime

Table: product_variants
- id: UUID (PK)
- product_id: UUID (FK → products)
- name: String
- sku: String (unique)
- weight_kg: Decimal
- retail_price: Decimal
- cost: Decimal
- barcode: String (nullable)
- is_active: Boolean (default true)
- created_at: DateTime

Table: pricing_tiers
- id: UUID (PK)
- product_id: UUID (FK → products, nullable)
- tier_name: String
- min_order_kg: Decimal
- price_per_kg: Decimal
- discount_percent: Decimal
- margin_percent: Decimal
- is_global: Boolean (default false)
- created_at: DateTime
- updated_at: DateTime

Table: suppliers
- id: UUID (PK)
- name: String
- contact_person: String (nullable)
- email: String (nullable)
- phone: String (nullable)
- address: Text (nullable)
- notes: Text (nullable)
- is_active: Boolean (default true)
- created_at: DateTime
```

### 3. Sales & Orders
```
Table: clients
- id: UUID (PK)
- name: String
- email: String
- phone: String
- company_name: String (nullable)
- city: String (nullable)
- pricing_tier: String (nullable)
- type: String (b2b_wholesale/b2c_direct/event/export)
- status: String (active/inactive)
- total_lifetime_value: Decimal (calculated)
- notes: Text (nullable)
- created_at: DateTime
- updated_at: DateTime
- created_by: UUID (FK → users)

Table: orders
- id: UUID (PK)
- order_number: String (unique, auto: ORD-2026-0001)
- client_id: UUID (FK → clients)
- channel: String (b2b_wholesale/b2c_direct/event/export)
- status: String (draft/confirmed/processing/shipped/delivered/cancelled)
- payment_status: String (pending/partial/paid/overdue)
- fulfillment: String (pending/packed/shipped/delivered)
- subtotal: Decimal
- discount_amount: Decimal (default 0)
- vat_amount: Decimal
- shipping_cost: Decimal (default 0)
- total_amount: Decimal
- notes: Text (nullable)
- assigned_to: UUID (FK → users, nullable)
- created_by: UUID (FK → users)
- order_date: DateTime
- confirmed_at: DateTime (nullable)
- shipped_at: DateTime (nullable)
- delivered_at: DateTime (nullable)
- created_at: DateTime
- updated_at: DateTime

Table: order_items
- id: UUID (PK)
- order_id: UUID (FK → orders)
- product_id: UUID (FK → products)
- variant_id: UUID (FK → product_variants, nullable)
- quantity: Decimal
- unit_price: Decimal
- discount_percent: Decimal (default 0)
- line_total: Decimal
- created_at: DateTime

Table: invoices
- id: UUID (PK)
- invoice_number: String (unique)
- order_id: UUID (FK → orders)
- client_id: UUID (FK → clients)
- issue_date: Date
- due_date: Date
- subtotal: Decimal
- vat_amount: Decimal
- total_amount: Decimal
- status: String (draft/sent/paid/overdue/cancelled)
- paid_amount: Decimal (default 0)
- paid_at: DateTime (nullable)
- notes: Text (nullable)
- created_at: DateTime
```

### 4. Inventory
```
Table: raw_materials
- id: UUID (PK)
- name: String
- sku: String (unique, auto: RM-001)
- category: String (base_powder/flavoring/packaging/other)
- current_stock: Decimal (kg)
- reserved_stock: Decimal (default 0)
- available_stock: Decimal (calculated)
- unit_cost: Decimal
- reorder_threshold: Decimal
- reorder_qty: Decimal
- supplier_id: UUID (FK → suppliers, nullable)
- location: String (al_ahsa_warehouse/khobar_office)
- expiry_date: Date (nullable)
- last_restocked: Date (nullable)
- notes: Text (nullable)
- is_active: Boolean (default true)
- created_at: DateTime
- updated_at: DateTime

Table: finished_products
- id: UUID (PK)
- product_id: UUID (FK → products)
- variant_id: UUID (FK → product_variants)
- sku: String (unique, auto-generated)
- current_stock: Decimal (units)
- reserved_stock: Decimal (default 0)
- available_stock: Decimal (calculated)
- unit_cost: Decimal (COGS)
- retail_price: Decimal
- location: String (al_ahsa_warehouse/khobar_office)
- batch_number: String (nullable)
- production_date: Date (nullable)
- expiry_date: Date (nullable)
- is_active: Boolean (default true)
- created_at: DateTime
- updated_at: DateTime

Table: stock_movements
- id: UUID (PK)
- movement_number: String (unique, auto: SM-2026-0001)
- type: String (stock_in/stock_out/adjustment/transfer/return)
- item_type: String (raw_material/finished_product)
- item_id: UUID (FK)
- quantity: Decimal (+ for in, - for out)
- reason: String
- reference_type: String (nullable)
- reference_id: UUID (nullable)
- performed_by: UUID (FK → users)
- notes: Text (nullable)
- created_at: DateTime
```

### 5. Finance
```
Table: transactions
- id: UUID (PK)
- transaction_number: String (unique)
- type: String (revenue/expense)
- order_id: UUID (FK → orders, nullable)
- invoice_id: UUID (FK → invoices, nullable)
- amount: Decimal
- vat_amount: Decimal (default 0)
- net_amount: Decimal
- payment_method: String (nullable)
- payment_date: Date
- status: String (pending/completed/failed)
- notes: Text (nullable)
- created_at: DateTime

Table: expenses
- id: UUID (PK)
- expense_number: String (unique)
- category: String
- amount: Decimal
- vat_amount: Decimal (default 0)
- vendor: String (nullable)
- payment_method: String
- receipt_url: String (nullable)
- is_recurring: Boolean (default false)
- recurring_frequency: String (nullable)
- approved_by: UUID (FK → users, nullable)
- expense_date: Date
- notes: Text (nullable)
- created_by: UUID (FK → users)
- created_at: DateTime

Table: subscriptions
- id: UUID (PK)
- name: String
- provider: String
- cost_monthly: Decimal
- billing_cycle: String (monthly/yearly)
- billing_date: Date
- category: String
- users_count: Integer
- renewal_date: Date
- status: String (active/cancelled)
- notes: Text (nullable)
- created_at: DateTime
- updated_at: DateTime
```

### 6. Production
```
Table: production_batches
- id: UUID (PK)
- batch_number: String (unique, auto: BATCH-2026-0001)
- product_id: UUID (FK → products)
- variant_id: UUID (FK → product_variants, nullable)
- target_qty: Decimal (kg)
- actual_qty: Decimal (nullable)
- yield_percent: Decimal (calculated)
- status: String (planned/in_progress/quality_check/completed/failed)
- start_date: DateTime
- end_date: DateTime (nullable)
- quality_score: Integer (nullable, 1-10)
- notes: Text (nullable)
- produced_by: UUID (FK → users)
- created_at: DateTime
- updated_at: DateTime

Table: batch_items
- id: UUID (PK)
- batch_id: UUID (FK → production_batches)
- raw_material_id: UUID (FK → raw_materials)
- quantity_used: Decimal (kg)
- created_at: DateTime

Table: quality_checks
- id: UUID (PK)
- batch_id: UUID (FK → production_batches)
- visual_inspection: String (pass/fail)
- visual_notes: Text (nullable)
- weight_verification: String (pass/fail)
- weight_notes: Text (nullable)
- taste_test: String (pass/fail)
- taste_notes: Text (nullable)
- lab_analysis: Text (nullable)
- sfda_compliance: String (pass/fail)
- overall_score: Integer (1-10)
- passed: Boolean
- checked_by: UUID (FK → users)
- checked_at: DateTime
- notes: Text (nullable)
- created_at: DateTime

Table: rnd_projects
- id: UUID (PK)
- name: String
- category: String (new_flavor/new_product_line/improvement/research)
- status: String (ideation/formulation/testing/sfda_submission/approved/archived)
- lead_id: UUID (FK → users)
- formulation_details: Text (nullable)
- test_results: Text (nullable)
- cost_estimate: Decimal (nullable)
- target_launch_date: Date (nullable)
- related_suppliers: JSON
- attachments: JSON
- notes: Text (nullable)
- created_at: DateTime
- updated_at: DateTime
```

### 7. CRM
```
Table: contacts
- id: UUID (PK)
- name: String
- email: String (nullable)
- phone: String (nullable)
- company_id: UUID (FK → companies, nullable)
- role_title: String (nullable)
- type: String (client/lead/supplier/partner/investor/other)
- source: String
- tags: JSON (array)
- city: String (nullable)
- last_contacted: Date (nullable)
- notes: Text (nullable)
- assigned_to: UUID (FK → users)
- created_by: UUID (FK → users)
- created_at: DateTime
- updated_at: DateTime

Table: companies
- id: UUID (PK)
- name: String
- industry: String (cafe/retail/distribution/hotel/other)
- city: String (nullable)
- website: String (nullable)
- pricing_tier: String (nullable)
- contract_status: String (active/pending/expired/none)
- total_lifetime_value: Decimal (calculated)
- notes: Text (nullable)
- created_at: DateTime
- updated_at: DateTime

Table: deals
- id: UUID (PK)
- title: String
- contact_id: UUID (FK → contacts)
- company_id: UUID (FK → companies, nullable)
- stage: String
- value: Decimal (nullable)
- expected_close_date: Date (nullable)
- actual_close_date: Date (nullable)
- lost_reason: String (nullable)
- notes: Text (nullable)
- assigned_to: UUID (FK → users)
- created_by: UUID (FK → users)
- created_at: DateTime
- updated_at: DateTime

Table: activities
- id: UUID (PK)
- contact_id: UUID (FK → contacts)
- deal_id: UUID (FK → deals, nullable)
- type: String (call/email/meeting/note/task)
- description: Text
- activity_date: DateTime
- created_by: UUID (FK → users)
- created_at: DateTime

Table: event_leads
- id: UUID (PK)
- event_id: UUID (FK → events, nullable)
- name: String
- company_name: String (nullable)
- email: String (nullable)
- phone: String (nullable)
- interest_level: String (hot/warm/cold)
- products_interest: JSON
- notes: Text (nullable)
- follow_up_date: Date (nullable)
- status: String (new/contacted/qualified/converted/lost)
- assigned_to: UUID (FK → users)
- created_at: DateTime
- updated_at: DateTime
```

### 8. Team & Tasks
```
Table: projects
- id: UUID (PK)
- name: String
- description: Text (nullable)
- owner_id: UUID (FK → users)
- start_date: Date (nullable)
- end_date: Date (nullable)
- status: String (planning/active/on_hold/completed)
- progress: Integer (0-100, calculated)
- created_at: DateTime
- updated_at: DateTime

Table: tasks
- id: UUID (PK)
- title: String
- description: Text (nullable)
- status: String (todo/in_progress/in_review/done/blocked)
- priority: String (urgent/high/medium/low)
- assigned_to: UUID (FK → users, nullable)
- due_date: Date (nullable)
- project_id: UUID (FK → projects, nullable)
- related_module: String (nullable)
- tags: JSON (array)
- parent_task_id: UUID (FK → tasks, nullable)
- created_by: UUID (FK → users)
- completed_at: DateTime (nullable)
- created_at: DateTime
- updated_at: DateTime

Table: task_comments
- id: UUID (PK)
- task_id: UUID (FK → tasks)
- user_id: UUID (FK → users)
- content: Text
- created_at: DateTime

Table: task_attachments
- id: UUID (PK)
- task_id: UUID (FK → tasks)
- file_url: String
- file_name: String
- uploaded_by: UUID (FK → users)
- created_at: DateTime
```

### 9. Marketing
```
Table: campaigns
- id: UUID (PK)
- name: String
- channel: String
- status: String (planning/active/paused/completed)
- start_date: Date
- end_date: Date (nullable)
- budget: Decimal
- actual_spend: Decimal (default 0)
- impressions: Integer (default 0)
- clicks: Integer (default 0)
- conversions: Integer (default 0)
- revenue: Decimal (default 0)
- roi: Decimal (calculated)
- notes: Text (nullable)
- created_by: UUID (FK → users)
- created_at: DateTime
- updated_at: DateTime

Table: content_calendar
- id: UUID (PK)
- scheduled_date: Date
- platform: String
- content_type: String
- topic: String
- status: String (draft/approved/published)
- content_url: String (nullable)
- assigned_to: UUID (FK → users, nullable)
- notes: Text (nullable)
- created_by: UUID (FK → users)
- created_at: DateTime
- updated_at: DateTime
```

### 10. Events
```
Table: events
- id: UUID (PK)
- name: String
- type: String (trade_show/exhibition/pop_up/festival/conference)
- location: String
- start_date: Date
- end_date: Date
- status: String (planning/confirmed/active/completed/cancelled)
- budget: Decimal
- actual_cost: Decimal (default 0)
- booth_number: String (nullable)
- booth_size: String (nullable)
- team_attending: JSON (array of user IDs)
- objectives: Text (nullable)
- results_summary: Text (nullable)
- created_by: UUID (FK → users)
- created_at: DateTime
- updated_at: DateTime

Table: event_inventory
- id: UUID (PK)
- event_id: UUID (FK → events)
- product_id: UUID (FK → products)
- variant_id: UUID (FK → product_variants, nullable)
- quantity: Integer
- packaging_type: String (nullable)
- is_reserved: Boolean (default true)
- created_at: DateTime

Table: event_teams
- id: UUID (PK)
- event_id: UUID (FK → events)
- user_id: UUID (FK → users)
- role: String (nullable)
- created_at: DateTime
```

### 11. Documents
```
Table: document_categories
- id: UUID (PK)
- name: String
- description: String (nullable)
- default_access: String (ceo_only/admin/all_team)
- created_at: DateTime

Table: documents
- id: UUID (PK)
- name: String
- category_id: UUID (FK → document_categories)
- file_url: String
- file_type: String
- file_size: Integer
- version: Integer (default 1)
- description: Text (nullable)
- related_module: String (nullable)
- access_permissions: JSON (array of roles)
- uploaded_by: UUID (FK → users)
- created_at: DateTime
- updated_at: DateTime
```

### 12. Strategy
```
Table: okrs
- id: UUID (PK)
- objective: String
- description: Text (nullable)
- owner_id: UUID (FK → users)
- quarter: String (e.g., "Q1 2026")
- status: String (on_track/at_risk/behind)
- progress: Integer (0-100)
- created_by: UUID (FK → users)
- created_at: DateTime
- updated_at: DateTime

Table: key_results
- id: UUID (PK)
- okr_id: UUID (FK → okrs)
- title: String
- target_value: Decimal
- current_value: Decimal (default 0)
- unit: String
- progress: Integer (0-100)
- created_at: DateTime
- updated_at: DateTime

Table: roadmap_initiatives
- id: UUID (PK)
- name: String
- category: String
- description: Text (nullable)
- start_quarter: String
- end_quarter: String
- status: String (planned/in_progress/completed)
- progress: Integer (0-100)
- owner_id: UUID (FK → users, nullable)
- created_at: DateTime
- updated_at: DateTime

Table: investor_relations
- id: UUID (PK)
- investor_name: String
- contact_person: String (nullable)
- email: String (nullable)
- phone: String (nullable)
- meeting_history: JSON
- pitch_deck_version: String (nullable)
- funding_round: String (nullable)
- notes: Text (nullable)
- created_at: DateTime
- updated_at: DateTime
```

### 13. Settings
```
Table: company_settings
- id: UUID (PK)
- company_name: String
- logo_url: String (nullable)
- address: Text (nullable)
- cr_number: String (nullable)
- vat_number: String (nullable)
- sfda_license: String (nullable)
- currency: String (default "SAR")
- timezone: String (default "Asia/Riyadh")
- language: String (default "en")
- created_at: DateTime
- updated_at: DateTime

Table: audit_logs
- id: UUID (PK)
- user_id: UUID (FK → users)
- action: String
- module: String
- record_id: UUID
- old_values: JSON (nullable)
- new_values: JSON (nullable)
- ip_address: String (nullable)
- created_at: DateTime

Table: notifications
- id: UUID (PK)
- user_id: UUID (FK → users)
- type: String
- title: String
- message: Text
- is_read: Boolean (default false)
- link: String (nullable)
- created_at: DateTime
```

---

## Cross-Module Relations

```
Users → Orders (created_by, assigned_to)
Users → Clients (created_by)
Users → Stock Movements (performed_by)
Users → Expenses (created_by, approved_by)
Users → Production Batches (produced_by)
Users → Tasks (created_by, assigned_to)
Users → Contacts (created_by, assigned_to)
Users → Deals (created_by, assigned_to)
Users → Campaigns (created_by)
Users → Events (created_by)
Users → Documents (uploaded_by)
Users → OKRs (owner, created_by)

Products → Product Variants (one-to-many)
Products → Pricing Tiers (one-to-many)
Products → Order Items (one-to-many)
Products → Finished Products (one-to-many)
Products → Production Batches (one-to-many)
Products → Event Inventory (one-to-many)

Clients → Orders (one-to-many)
Clients → Invoices (one-to-many)
Clients → Contacts (many-to-one via company)

Orders → Order Items (one-to-many)
Orders → Invoices (one-to-many)
Orders → Transactions (one-to-many)
Orders → Stock Movements (reference)

Raw Materials → Stock Movements (one-to-many)
Raw Materials → Batch Items (one-to-many)

Finished Products → Stock Movements (one-to-many)
Finished Products → Event Inventory (one-to-many)

Production Batches → Batch Items (one-to-many)
Production Batches → Quality Checks (one-to-many)
Production Batches → Stock Movements (reference)

Companies → Contacts (one-to-many)
Companies → Deals (one-to-many)

Contacts → Deals (one-to-many)
Contacts → Activities (one-to-many)

Events → Event Inventory (one-to-many)
Events → Event Teams (one-to-many)
Events → Event Leads (one-to-many)

Projects → Tasks (one-to-many)

OKRs → Key Results (one-to-many)
```

---

## Color System

```css
--primary: #1A1A2E          /* Sidebar, headers */
--accent-gold: #E8A838      /* CTAs, highlights */
--accent-green: #2D6A4F     /* Success states */
--accent-red: #D32F2F       /* Alerts, warnings */
--bg-main: #F5F5F0          /* Main background */
--bg-card: #FFFFFF          /* Card backgrounds */
--bg-sidebar: #1A1A2E       /* Sidebar */
--text-primary: #333333     /* Body text */
--text-secondary: #757575    /* Labels */
--border: #E0E0E0           /* Borders */
```

---

## Sidebar Navigation Structure

```
Overview
  - CEO Dashboard
  - Company Profile

Sales & Orders
  - Orders
  - Clients
  - Wholesale
  - Export
  - Invoices

Inventory
  - Raw Materials
  - Finished Products
  - Stock Movements

Production
  - Production Batches
  - Quality Control
  - R&D

Products
  - Product Catalog
  - Pricing Tiers
  - Formulations

Finance
  - Revenue
  - Expenses
  - P&L
  - Subscriptions

CRM
  - Contacts
  - Companies
  - Deals Pipeline
  - Event Leads

Marketing
  - Campaigns
  - Ad Budget & ROI
  - Content Calendar

Events & Expos
  - Event Calendar
  - Booth Planning
  - Event Inventory

Team & Tasks
  - Task Board
  - Projects
  - Team Directory

Documents
  - Legal Docs
  - Contracts
  - SOPs
  - Templates

Strategy
  - Business Plan
  - OKRs
  - Goals

Settings
  - Users & Roles
  - Company Settings
  - Integrations
```

---

## Component Library

```
KPICard - Metric card with value, trend arrow, comparison %
DataTable - Sortable, filterable, paginated table
DetailDrawer - Slide-in panel for viewing/editing
StatusBadge - Color-coded pill for status
MetricChart - Line/bar/area chart
FormModal - Modal dialog for forms
EmptyState - Illustration + CTA
SearchBar - Global search
FilterBar - Horizontal filter chips
Timeline - Vertical timeline for activity
```

---

## Workflows

### Order-to-Cash Flow
1. New inquiry → CRM: New Lead created
2. Lead qualified → CRM: stage update
3. Deal closed → Order: new order created
4. Order confirmed → Inventory: stock reserved
5. Order fulfilled → Inventory: stock deducted, Finance: revenue entry
6. Invoice generated → Finance: invoice PDF
7. Payment received → Finance: payment recorded

### Production-to-Inventory Flow
1. Low stock alert → Inventory: below threshold
2. Production batch planned → Production: new batch
3. Raw materials allocated → Inventory: raw materials reserved
4. Production completed → Production: status = completed
5. QC passed → Production: quality approved
6. Inventory updated → Finished product stock increased, raw materials deducted

### Event Lifecycle Flow
1. Event created → Events: new record
2. Inventory planned → Events: product list created
3. Event executed → Events: status = Active
4. Leads captured → CRM: new contacts with event source
5. Post-event → Events: results summary, CRM: leads enter pipeline
