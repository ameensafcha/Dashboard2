-- AlterTable
ALTER TABLE "products" ADD COLUMN     "labor_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "overhead_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "packaging_cost" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "product_recipe_items" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "business_id" TEXT NOT NULL,

    CONSTRAINT "product_recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_recipe_items_product_id_idx" ON "product_recipe_items"("product_id");

-- CreateIndex
CREATE INDEX "product_recipe_items_raw_material_id_idx" ON "product_recipe_items"("raw_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_recipe_items_product_id_raw_material_id_key" ON "product_recipe_items"("product_id", "raw_material_id");

-- AddForeignKey
ALTER TABLE "product_recipe_items" ADD CONSTRAINT "product_recipe_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recipe_items" ADD CONSTRAINT "product_recipe_items_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recipe_items" ADD CONSTRAINT "product_recipe_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
