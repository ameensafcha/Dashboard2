# Safcha Dashboard Master Build Sequence (End-to-End)

This document is the **Comprehensive Master Plan** for the entire Safcha Dashboard, detailing all phases from start to finish. It includes what has already been built (Phases 1 & 2) and breaks down the remaining phases into atomic, highly granular steps.

---

## ✅ Phase 1: Foundation (Completed)
**Goal:** Initialize the project, set up the architecture, and build the core layout.
- [x] Initialize Next.js 14 App Router project.
- [x] Install & configure Tailwind CSS, shadcn/ui.
- [x] Configure PostgreSQL database and Prisma 5 ORM.
- [x] Setup Zustand for global state management (Theme, Language, Modals).
- [x] Build Left Sidebar navigation (Dark mode #1A1A2E).
- [x] Build Top Header (Search bar, responsive toggle, user avatar).
- [x] Create reusable UI components (`PageHeader`, `KPICard`).

---

## ✅ Phase 2: Product Catalog (Completed)
**Goal:** Build the central catalog for all Safcha products and variants.
- [x] Add `Product`, `Category`, `PricingTier`, `Supplier` models to Prisma schema.
- [x] Build Products List UI with pagination and filtering.
- [x] Build "New Product" modal and Server Actions (Create/Update/Delete).
- [x] Implement RTL language dictionary for products page.
- [x] Build Product Details view and manage associated pricing tiers.
- [x] *(Refinement)* Removed complex Variants structure to favor a simpler Flat Product model based on user feedback.

---

## ✅ Phase 3: CRM Configuration (Completed)
**Goal:** Build the foundation for tracking customers so they can be attached to Orders.
### Section 3.1: Database Foundation
- [x] Add `Client` model to Prisma (Name, Email, Phone, Company, Type, Source, Tags, City, Notes).
- [x] Add `Company` model to Prisma (Name, Industry, City, Website, LifetimeValue).
- [x] Add `Deal` model to Prisma for the pipeline (Title, Value, Stage, ExpectedCloseDate).
- [x] Link `PricingTier` to `Client` and `Company` records.
- [x] Run `npx prisma db push` and `generate`.

### Section 3.2: Companies View
- [x] Create `/crm/companies/page.tsx` displaying a DataTable.
- [x] Build `NewCompanyModal.tsx` form.
- [x] Build `CompanyDetailDrawer.tsx` to slide in from the right when clicking a row.
- [x] Implement Server Actions for Create/Update/Delete Company.

### Section 3.2.1: Multi-Category Pricing Tiers (Completed)
- [x] Created `CompanyPricingTier` join table in Prisma schema.
- [x] Refactored `createCompany` and `updateCompany` server actions to support an array of tiers.
- [x] Upgraded `NewCompanyModal.tsx` to dynamically render a Pricing Tier dropdown for every active Product Category.
- [x] Refactored `CompanyDetailDrawer` and `CompaniesClient` to gracefully display arrays of Pricing Tiers.

### Section 3.3: Contacts View
- [x] Create `/crm/contacts/page.tsx` displaying a DataTable.
- [x] Build `NewContactModal.tsx` form.
- [x] Build `ContactDetailDrawer.tsx` (Slide-in).
- [x] Implement Server Actions for Create/Update/Delete Contact.

### Section 3.4: Deals Pipeline (Kanban)
- [x] Create `/crm/pipeline/page.tsx`.
- [x] Build drag-and-drop Kanban interface for Deals.
- [x] Map columns: `New Lead`, `Qualified`, `Sample Sent`, `Proposal`, `Negotiation`, `Closed Won`, `Closed Lost`.
- [x] Implement Server Action to update Deal Stage on drag-drop.

---

## ⏳ Phase 4: Sales & Orders
**Goal:** Build the system to process sales and generate invoices.
*Dependency: Relies on Phase 3 CRM to exist.*
### Section 4.1: Database Foundation
- [x] Add `Order` model to Prisma (OrderID, Date, Channel, TotalAmount, Status, PaymentStatus, FulfillmentStatus, Notes).
- [x] Add `OrderItem` model to Prisma (linked to Product, Variant, Quantity, UnitPrice, Discount, Total).
- [x] Add `Invoice` model to Prisma.
- [x] Link `Order` to `Client`.
- [x] Run `npx prisma db push`.

### Section 4.2: Orders List View
- [x] Create `/orders/page.tsx` displaying a DataTable of all orders.
- [x] Add `StatusBadge` component for Order Status (`Draft`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
- [x] Add Filter dropdowns for `Channel` and `Status`.

### Section 4.3: New Order Form (Complex)
- [x] Create `/orders/new/page.tsx` (Full page form, not a modal).
- [x] Auto-generate `ORD-2026-XXXX` ID.
- [x] Build "Select Client" dropdown (searches CRM).
- [x] **Logic:** Auto-fetch Client's assigned `PricingTier` upon selection.
- [x] Build dynamic "Line Items" section to add multiple products.
- [x] **Logic:** Auto-calculate Line Item Total = (Qty * Tier Price) - Discount.
- [x] **Logic:** Auto-calculate Order Subtotal, VAT (15%), Shipping, and Grand Total.
- [x] Build Server Action `createOrder` saving Order and OrderItems simultaneously.

### Section 4.4: Order Details & Invoicing
- [x] Create `/orders/[id]/page.tsx` or Slide-in Drawer for Order Details.
- [x] Add "Generate Invoice" button.
- [x] Build PDF generation logic for the Invoice (using `jspdf` or similar).
- [x] Build Payment Timeline UI component.

---

## ⏳ Phase 5: Inventory Core
**Goal:** Build the tables and UI to track raw materials and finished goods.
### Section 5.1: Database Foundation
- [x] Add `RawMaterial` model to Prisma (Name, SKU, Category, CurrentStock, UnitCost, ReorderThreshold).
- [x] Add `FinishedProduct` model to Prisma (Name, Variant, SKU, CurrentStock, ReservedStock, UnitCost, Location).
- [x] Add `StockMovement` model to Prisma (MovementID, Date, Type, Quantity, Reason, Notes).
- [x] Run `npx prisma db push`.

### Section 5.2: Raw Materials UI
- [x] Create `/inventory/raw-materials/page.tsx` DataTable.
- [x] Build `NewMaterialModal` with auto-SKU, category, supplier dropdown.
- [x] Implement Low Stock Alert logic (red badge when stock ≤ threshold).
- [x] Build `/products/suppliers` page with `NewSupplierModal` for supplier CRUD.

### Section 5.3: Finished Products UI
- [x] Create `/inventory/finished/page.tsx` DataTable.
- [x] Display `AvailableStock` as `CurrentStock - ReservedStock`.

### Section 5.4: Manual Adjustments
- [x] Create `LogMovementModal.tsx` accessible from both UI pages.
- [x] Build form to select Type (`Stock In`, `Stock Out`, `Adjustment`), input Quantity, and Reason.
- [x] Build Server Action `logMovement` that updates Inventory balances and saves log in a single transaction.

---

## ✅ Phase 6: Inventory + Orders Automation
**Goal:** Automate stock deduction when orders ship.
### Section 6.1: Reserve Logic
- [x] Map logic in `updateOrderStatus`: If changing to `Confirmed`, iterate through `OrderItems` and ADD their quantities to `FinishedProduct` -> `ReservedStock`.

### Section 6.2: Ship Logic
- [x] Map logic in `updateOrderStatus`: If changing to `Shipped`, iterate through `OrderItems`.
- [x] REDUCE `ReservedStock` by quantity.
- [x] REDUCE `CurrentStock` by quantity.
- [x] CREATE `StockOut` movement log for each product.

---

## ✅ Phase 7: Production Completion (Auto-Inventory)
**Goal:** Finish the Production module by automating stock updates when manufacturing completes.
### Section 7.1: Raw Material Consumption
- [x] Update existing `NewProductionBatchModal`.
- [x] Add dynamic fields to select `RawMaterials` and input `Quantity Used`.
- [x] Modify `createProductionBatch` Action to save these into the `BatchItem` table.

### Section 7.2: QC Checklist UI Form
- [x] Build a 5-step form (Visual, Weight, Taste, Lab analysis, SFDA) inside `/production/quality`.
- [x] Build Server Action `submitQualityCheck`.
- [x] **Gate Logic:** If any toggle fails, set Batch Status to `Failed` and block progression.

### Section 7.3: Batch Completion Automation
- [x] Map logic in `updateBatchStatus`: If changing to `Completed` (and passed QC):
  - INCREASE Finished Product `CurrentStock` by `Actual Quantity`.
  - CREATE `StockIn` movement log.
  - DECREASE Raw Material `CurrentStock` by amounts in `BatchItems`.
  - CREATE `StockOut` movement logs for Raw Materials.

---

## ⏳ Phase 8: Finance API
**Goal:** Generate Revenue automatically when orders are delivered.
### Section 8.1: Transactions
- [ ] Add `Transaction`, `Expense` models to Prisma.
- [ ] Map logic in `updateOrderStatus`: If changing to `Delivered`, auto-create a Revenue `Transaction` equal to the Grand Total.

### Section 8.2: Expenses & P&L
- [ ] Create `/finance/expenses` DataTable and `NewExpenseModal.tsx`.
- [ ] Create P&L Dashboard calculating (Total Revenue - Total Expenses). 

---

## ⏳ Phase 9: CEO Dashboard (Overview)
**Goal:** Connect all modules into a single real-time snapshot.
- [ ] **Global KPIs:** Wire up the KPI cards for Total Revenue (Phase 8), Gross Margin (Phase 8), and Inventory Value (Phase 5).
- [ ] **Charts:** Build Revenue Trend line chart (Recharts) and Sales by Channel donut chart.
- [ ] **Activity Feed:** Aggregate the latest 20 actions from Orders, Movements, and Batches into a live feed scrolling component.

---

## ⏳ Phase 10: Extra Modules
**Goal:** Build remaining independent tools.
- [ ] **Marketing:** UI for Campaign tracking and Ad Budget planning.
- [ ] **Events & Expos:** UI for Event Planning, Booth Inventory lists, and Lead capture.
- [ ] **Team & Tasks:** UI for internal Kanban task board, employee directory, and onboarding checklists.
- [ ] **Document Vault:** UI to upload and categorize PDFs, Legal Docs, and SOPs (requires Supabase Storage integration).
