# Safcha Dashboard - Product Variants Management Plan

## Overview
The user needs to manage multiple sizes (variants) for their products in the catalog. Some products may have 1Kg, 500g, or other custom sizes. 

## Project Type
**WEB** (Next.js Dashboard)

## Success Criteria
- [ ] Users can click "Manage Variants" on any product in the catalog.
- [ ] A dedicated modal/page opens specifically for that product's variants.
- [ ] Users can add new variants with custom string sizes (e.g., "500g", "1kg", "Box of 12").
- [ ] Users can edit existing variants (change price, cost, SKU, size).
- [ ] Users can soft-delete or deactivate variants.

## Tech Stack
- **Database:** Prisma (PostgreSQL)
- **State Mgmt:** Zustand (`productStore.ts`)
- **UI:** Shadcn UI, Tailwind CSS, Lucide Icons, `react-hook-form` & `zod`.

## File Structure Changes
```text
prisma/
  └── schema.prisma                # Update ProductVariant model (change weightKg to string size)
app/actions/product/
  └── actions.ts                   # Add Server Actions (getVariants, createVariant, updateVariant, deleteVariant)
components/products/
  ├── ProductTable.tsx             # Add "Manage Variants" action button
  ├── ProductGrid.tsx              # Add "Manage Variants" action button
  └── ManageVariantsModal.tsx      # [NEW] Dedicated UI for CRUD operations on variants
stores/
  └── productStore.ts              # Add state for viewing/editing variants
```

## Task Breakdown

### Task 1: Database Schema Update
- **Description:** `ProductVariant` currently uses `weightKg` as a Decimal. We need to replace or rename this to a string `size` field to allow inputs like "500g", "1 Liter", etc.
- **Agent:** `database-architect`
- **Skill:** `database-design`
- **INPUT:** `schema.prisma`
- **OUTPUT:** Updated schema, generated Prisma Client.
- **VERIFY:** `npx prisma db push` succeeds and TypeScript definitions (`ProductVariant` type) update correctly.

### Task 2: Server Actions & Zod Validation
- **Description:** Create standalone CRUD functions for variants in `app/actions/product/actions.ts`. Create a Zod schema for variant validation.
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **INPUT:** `productSchema` in `actions.ts`.
- **OUTPUT:** `variantSchema`, `getVariantsForProduct`, `createVariant`, `updateVariant`, `deleteVariant` functions.
- **VERIFY:** Functions return expected `Result<{ success: boolean }>` patterns and type-check passes.

### Task 3: Zustand Store Expansion
- **Description:** Add actions to `productStore.ts` to handle modal visibility and the active selected product for variants.
- **Agent:** `frontend-specialist`
- **Skill:** `react-best-practices`
- **INPUT:** `useProductStore`.
- **OUTPUT:** `isVariantsModalOpen`, `selectedProductForVariants`, `setVariantsModalOpen` states.
- **VERIFY:** Store updates without causing unnecessary global re-renders.

### Task 4: UI Implementation (Manage Variants Modal)
- **Description:** Build the dedicated modal (`ManageVariantsModal.tsx`). It will fetch variants on mount based on the selected product, show them in a neat list/table, and allow inline adding/editing.
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **INPUT:** Existing Shadcn `Dialog` components.
- **OUTPUT:** A functional `ManageVariantsModal.tsx` injected into `ProductList.tsx`.
- **VERIFY:** Users can view the list of variants, add a new one, and see it appear instantly without a full page reload.

### Task 5: Integration & Entry Points
- **Description:** Add the "Manage Variants" button to `ProductTable.tsx` and `ProductGrid.tsx` row actions.
- **Agent:** `frontend-specialist`
- **Skill:** `clean-code`
- **INPUT:** Product Listing components.
- **OUTPUT:** New buttons triggering `setVariantsModalOpen(true)` alongside `setSelectedProduct(product)`.
- **VERIFY:** Clicking the button correctly loads the targeted product's variants.

## ✅ PHASE X: Verification Checklist
- [x] Lint check passes (`npm run lint`).
- [x] No Type errors (`npx tsc --noEmit`).
- [x] `schema.prisma` changes deployed securely.
- [x] UI tested on both mobile and desktop (responsive tables).
- [x] No purple/violet UI elements used.
