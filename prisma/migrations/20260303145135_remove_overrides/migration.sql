/*
  Warnings:

  - Added the required column `business_id` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `batch_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `company_pricing_tiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `deals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `finished_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `pricing_tiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `production_batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `quality_checks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `raw_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `rnd_projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `suppliers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `system_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "business_id" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "entity_name" TEXT,
ADD COLUMN     "module" TEXT,
ADD COLUMN     "user_name" TEXT;

-- AlterTable
ALTER TABLE "batch_items" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "company_pricing_tiers" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "finished_products" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pricing_tiers" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "production_batches" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "quality_checks" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "raw_materials" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "rnd_projects" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "business_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "industry" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SA',
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    "vatNumber" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_users" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3),
    "invited_by" TEXT,

    CONSTRAINT "business_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "roles_business_id_idx" ON "roles"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_business_id_name_key" ON "roles"("business_id", "name");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_module_action_key" ON "role_permissions"("role_id", "module", "action");

-- CreateIndex
CREATE INDEX "business_users_business_id_idx" ON "business_users"("business_id");

-- CreateIndex
CREATE INDEX "business_users_user_id_idx" ON "business_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_users_business_id_user_id_key" ON "business_users"("business_id", "user_id");

-- CreateIndex
CREATE INDEX "audit_logs_business_id_created_at_idx" ON "audit_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_business_id_user_id_idx" ON "audit_logs"("business_id", "user_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_items" ADD CONSTRAINT "batch_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rnd_projects" ADD CONSTRAINT "rnd_projects_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_pricing_tiers" ADD CONSTRAINT "company_pricing_tiers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_users" ADD CONSTRAINT "business_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_users" ADD CONSTRAINT "business_users_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
