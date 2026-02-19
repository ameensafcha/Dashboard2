-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('pure_safcha', 'ceremonial_blend', 'flavored_blend', 'karak', 'palm_dye', 'specialty');

-- CreateEnum
CREATE TYPE "SfdaStatus" AS ENUM ('approved', 'pending', 'not_submitted');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('active', 'in_development', 'discontinued');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "sku_prefix" TEXT NOT NULL,
    "description" TEXT,
    "key_ingredients" TEXT,
    "caffeine_free" BOOLEAN NOT NULL DEFAULT true,
    "sfda_status" "SfdaStatus" NOT NULL DEFAULT 'not_submitted',
    "sfda_reference" TEXT,
    "base_cost" DECIMAL(10,2) NOT NULL,
    "base_retail_price" DECIMAL(10,2) NOT NULL,
    "image" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'active',
    "launch_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "weight_kg" DECIMAL(10,3) NOT NULL,
    "retail_price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "barcode" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_tiers" (
    "id" TEXT NOT NULL,
    "product_id" TEXT,
    "tier_name" TEXT NOT NULL,
    "min_order_kg" DECIMAL(10,2) NOT NULL,
    "price_per_kg" DECIMAL(10,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL,
    "margin_percent" DECIMAL(5,2) NOT NULL,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
