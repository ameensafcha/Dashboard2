# PLAN: Phase 3 - Production Module

## Overview
This plan outlines the step-by-step implementation for **Phase 3: Production**, based directly on the `Safcha_Dashboard.pdf` specifications. The plan is broken down into small, verifiable sections so you can check each part after it's built. 

Note: We have already built some parts of the UI (Batches, QC, KPIs). This plan incorporates what is left to do and ensures all PDF requirements are fully met.

## Section 0: Foundation (Database Blocks)
*Goal: Build the schema definitions required for Production and Inventory.*
- [ ] **0.1 Add Inventory Tables to Prisma:**
  - Create `RawMaterial`, `FinishedProduct`, and `StockMovement` schemas matching tracking requirements (Current Stock, Reorder Threshold, etc.).
- [ ] **0.2 Link Batch Items:**
  - Update `BatchItem` to link properly to `RawMaterial`.
- [ ] **0.3 Push Schema:**
  - Run `npx prisma db push` and `npx prisma generate`.

---

## Section 1: Production Batches Core Logic & Refinement
*Goal: Ensure the Production Batches feature perfectly matches the PDF specs.*

- [ ] **1.1 Auto-ID Generation:**
  - Update creation logic to auto-generate `batch_number` like `BATCH-2026-0001`.
- [ ] **1.2 Raw Materials Consumption Entry:**
  - Add UI in the batch creation/edit form to select Raw Materials and specify `quantity_used`.
  - Save these to the `batch_items` database table.
- [ ] **1.3 Yield % Automation:**
  - Ensure the Yield % is cleanly calculated as `(Actual / Target) × 100` and displays properly in the table and details view.
- [ ] **1.4 Status & Details Constraints:**
  - Ensure users can log `start_date` and `end_date` properly.
  - Map the exact statuses: `Planned` | `In Progress` | `Quality Check` | `Completed` | `Failed`.

---

## Section 2: Quality Control (QC) Workflow
*Goal: Implement the strict 5-step QC checklist for completed batches.*

- [ ] **2.1 5-Step QC Form:**
  - Ensure the drawer/modal for Quality Control covers: Visual (Pass/Fail + Notes), Weight (Pass/Fail + Notes), Taste (Pass/Fail + Notes), Lab Analysis (Text), and SFDA Compliance (Pass/Fail).
- [ ] **2.2 Quality Score Calculation:**
  - Auto-calculate or allow manual entry of `Overall Score (1-10)`.
- [ ] **2.3 Batch Status Gate (CRITICAL):**
  - Logic gate: If a batch fails QC (`Passed: false`), its status must become `Failed` and it CANNOT proceed to stock.
  - Only batches that pass QC can be marked as `Completed`.

---

## Section 3: R&D / Product Development Tracker
*Goal: Implement the R&D tracker for experimental batches and new flavors.*

- [ ] **3.1 R&D Form Fields:**
  - Update the R&D form/UI to capture: `Category`, `Status` (Ideation, Formulation, Testing, etc.), `Lead User`, `Cost Estimate`, and `Target Launch Date`.
- [ ] **3.2 Rich Text Formulation Details:**
  - Ensure `Formulation Details` and `Test Results` use a rich text format or a wide text area to capture process steps and ratios.

---

## Section 4: Auto-Inventory Integration (CRITICAL LOGIC)
*Goal: Automate inventory movements when a production batch is completed.*

- [ ] **4.1 Stock Deduction (Raw Materials):**
  - When batch status changes to `Completed` (or during `In Progress`), deduct the quantities logged in `batch_items` from the respective Raw Materials' `Current Stock`.
  - Create `Stock Out` movement logs for each raw material used.
- [ ] **4.2 Stock Addition (Finished Products):**
  - When batch status changes to `Completed`, add the `Actual Qty` to the Finished Product's `Current Stock`.
  - Create a `Stock In` movement log for the finished product.
- [ ] **4.3 Reverting / Failed Batches:**
  - If a batch is marked `Failed`, raw materials are consumed (do not revert stock) but NO finished product stock is added. Ensure this logic is rock solid.

---

## Section 5: Production KPIs & Dashboard Perfection
*Goal: Finalize the CEO-level metrics for Production.*

- [ ] **5.1 Monthly Output (kg):**
  - Sum of `actual_qty` for completed batches in the current month.
- [ ] **5.2 Capacity Utilization %:**
  - `(Actual Output / Max Capacity) * 100` (Already Dynamic via Settings!).
- [ ] **5.3 Average Yield & QC Pass Rate:**
  - Verify calculations reflect only the current period and exclude failed/draft batches.
- [ ] **5.4 Production Cost per kg:**
  - Add a metric calculation: `Total raw material cost / Total output kg`.

---

## How to Proceed
Tell me: **"Start Section 1"** and I will implement all Section 1 items, then stop so you can review!
