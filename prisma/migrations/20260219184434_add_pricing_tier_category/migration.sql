/*
  Warnings:

  - A unique constraint covering the columns `[category_id]` on the table `pricing_tiers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pricing_tiers" ADD COLUMN     "category_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pricing_tiers_category_id_key" ON "pricing_tiers"("category_id");

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
