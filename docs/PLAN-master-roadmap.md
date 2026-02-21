# Safcha Dashboard Development Roadmap

## Architecture Dependencies
The dashboard modules are highly interconnected. We MUST build them in this specific order to ensure data flows correctly according to the PDF's `Cross-Module Workflows` section.

**Dependency Chain:**
`Products & Clients` -> `Orders` -> `Inventory` -> `Production` -> `Finance` -> `Dashboard KPIs`

---

## Phase 3: CRM (Clients & Companies)
*Dependency: None. Required for Orders.*

- [ ] **3.1 Schema:** Create `Client`, `Company`, `Contact` schemas. Make sure `Client` links to `PricingTier`.
- [ ] **3.2 UI Database:** Create the main CRM table view showing Clients and their lifetime value.
- [ ] **3.3 Forms:** Create "Add Client" and "Edit Client" modals.
- [ ] **3.4 Deals Pipeline:** Build the Kanban board for tracking leads and inquiries.

---

## Phase 4: Sales & Orders
*Dependency: Products, Clients, Pricing Tiers.*

- [ ] **4.1 Schema:** Create `Order`, `OrderItem`, and `Invoice` schemas.
- [ ] **4.2 UI Structure:** Build the Orders list view with filters for Channel (Wholesale, B2C, Event, Export).
- [ ] **4.3 Order Creation Workflow:**
  - Build the complex "New Order" form.
  - Must auto-apply the correct Pricing Tier based on the selected Client.
  - Must calculate Subtotal, Discount, VAT (15%), Shipping, and Total.
- [ ] **4.4 Order Detail Drawer:**
  - Build the slide-in drawer showing Line Items, Payment Timeline, and Status toggles.
- [ ] **4.5 Invoice Generation:**
  - Add logic to generate a PDF invoice when an order is Confirmed.

---

## Phase 5: Inventory Core
*Dependency: Products, Suppliers.*

- [ ] **5.1 Schema:** Create `RawMaterial`, `FinishedProduct`, and `StockMovement` schemas.
- [ ] **5.2 Raw Materials UI:**
  - Build table showing Current Stock, Reorder Threshold, Unit Cost.
  - Add visual badges/alerts for Low Stock.
- [ ] **5.3 Finished Products UI:**
  - Build table showing Current Stock vs Reserved Stock.
- [ ] **5.4 Manual Adjustments:**
  - Build form to manually log a `StockMovement` (Stock In / Stock Out / Adjustment).

---

## Phase 6: Inventory x Orders Automation
*Dependency: Orders (Phase 4), Inventory (Phase 5).*

- [ ] **6.1 Reserve Stock Logic:**
  - When an Order status = `Confirmed`, automatically add to `Reserved Stock` for those products.
- [ ] **6.2 Deduct Stock Logic:**
  - When Order status = `Shipped`, deduct the Reserved Stock and create a `Stock Out` movement log.
- [ ] **6.3 Low Stock Warning:**
  - If a new Order demands more stock than is available, flag the order and trigger a UI notification.

---

## Phase 7: Production Completion (Auto-Inventory)
*Dependency: Inventory Core (Phase 5).*

- [ ] **7.1 Raw Material Consumption:**
  - Update Batch creation modal to select Raw Materials and quantities.
  - Save to `batch_items` table.
- [ ] **7.2 Batch Completion Logic:**
  - When Batch = `Completed`: Create `Stock In` movement for the Finished Product and increase Current Stock.
  - Create `Stock Out` movements for the consumed Raw Materials and decrease their Current Stock.
- [ ] **7.3 QC Form:**
  - Build the 5-step checklist modal.
  - Add logic gate keeping Failed batches out of Finished Inventory.
- [ ] **7.4 R&D Tracker Completion:**
  - Add rich text editors for formulation details.

---

## Phase 8: Finance
*Dependency: Orders (Phase 4).*

- [ ] **8.1 Schema:** Create `Transaction` and `Expense` schemas.
- [ ] **8.2 Revenue Automation:**
  - When an Order is Delivered/Paid, automatically generate a Revenue Transaction.
- [ ] **8.3 Expense Tracking:**
  - Build UI to log expenses (Raw Materials, Marketing, Rent, Salaries).
- [ ] **8.4 P&L Dashboard:**
  - Build the Profit & Loss calculation engine (Revenue - COGS - Expenses).

---

## Phase 9: CEO Dashboard (The Apex)
*Dependency: ALL previous phases.*

- [ ] **9.1 Global KPIs:** Wire up the KPI cards for Total Revenue, Gross Margin, and Inventory Value.
- [ ] **9.2 Charts:** Build the Revenue Trend line chart and Sales by Channel donut chart.
- [ ] **9.3 Activity Feed:** Aggregate the latest 20 rows from Orders, Movements, and Batches into a live feed.

---

## Phase 10: Extra Modules (Independent)
*Dependency: None.*

- [ ] **10.1 Marketing:** Campaign tracker and ad budget planner.
- [ ] **10.2 Events:** Event planning, booth inventory, lead capture.
- [ ] **10.3 Team & Tasks:** Kanban task board and assignments.
- [ ] **10.4 Documents:** Vault for PDFs and SOPs.


---
*Let me know which Phase to begin coding! Start with "Phase 3: CRM" or "Phase 4: Sales & Orders"?*
