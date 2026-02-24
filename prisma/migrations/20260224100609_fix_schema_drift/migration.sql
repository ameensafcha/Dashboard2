/*
  Warnings:

  - You are about to alter the column `current_stock` on the `finished_products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `reserved_stock` on the `finished_products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `reorder_threshold` on the `finished_products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `min_order_kg` on the `pricing_tiers` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `max_order_kg` on the `pricing_tiers` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `target_qty` on the `production_batches` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `actual_qty` on the `production_batches` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `yield_percent` on the `production_batches` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `size` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.

*/
-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "finished_products" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "current_stock" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "reserved_stock" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "reorder_threshold" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pricing_tiers" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "min_order_kg" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "max_order_kg" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "production_batches" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "target_qty" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "actual_qty" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "yield_percent" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "size" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "raw_materials" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "details" JSONB,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
