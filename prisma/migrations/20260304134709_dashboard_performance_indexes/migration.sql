-- CreateIndex
CREATE INDEX "expenses_business_id_deleted_at_date_idx" ON "expenses"("business_id", "deleted_at", "date");

-- CreateIndex
CREATE INDEX "finished_products_business_id_deleted_at_idx" ON "finished_products"("business_id", "deleted_at");

-- CreateIndex
CREATE INDEX "orders_business_id_deleted_at_date_idx" ON "orders"("business_id", "deleted_at", "date");

-- CreateIndex
CREATE INDEX "production_batches_business_id_deleted_at_start_date_idx" ON "production_batches"("business_id", "deleted_at", "start_date");

-- CreateIndex
CREATE INDEX "raw_materials_business_id_deleted_at_idx" ON "raw_materials"("business_id", "deleted_at");

-- CreateIndex
CREATE INDEX "transactions_business_id_deleted_at_type_date_idx" ON "transactions"("business_id", "deleted_at", "type", "date");
