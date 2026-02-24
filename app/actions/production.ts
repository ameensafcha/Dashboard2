'use server';

import prisma from '@/lib/prisma';
import { Prisma, BatchStatus, RndStatus, StockMovementType, StockMovementReason } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';

const createBatchSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  targetQty: z.number().positive('Target quantity must be greater than zero'),
  status: z.nativeEnum(BatchStatus).optional(),
  startDate: z.date(),
  producedBy: z.string().optional(),
  notes: z.string().optional(),
});

const updateBatchSchema = z.object({
  status: z.nativeEnum(BatchStatus).optional(),
  producedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type ProductionBatchWithProduct = {
  id: string;
  batchNumber: string;
  productId: string;
  targetQty: number;
  actualQty: number | null;
  yieldPercent: number | null;
  status: string;
  startDate: Date;
  endDate: Date | null;
  qualityScore: number | null;
  producedBy: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  product: { id: string; name: string; size?: number | null; unit?: string | null } | null;
  batchItems: { id: string; materialName: string; quantityUsed: number }[];
  qualityChecks: {
    id: string;
    overallScore: number;
    passed: boolean;
    checkedAt: Date;
    visualInspection?: string;
    weightVerification?: string;
    tasteTest?: string;
    sfdaCompliance?: string;
    notes?: string | null;
  }[];
};

async function generateBatchNumber(date: Date = new Date()): Promise<string> {
  try {
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const yy = date.getFullYear().toString().slice(-2);
    const datePrefix = `${mm}${dd}${yy}`;

    // Safety check for stale client
    if (!prisma.productionBatch) {
      throw new Error('Database client not updated. Please restart the server.');
    }

    const lastBatch = await prisma.productionBatch.findFirst({
      where: { batchNumber: { startsWith: `BATCH-${datePrefix}` } },
      orderBy: { batchNumber: 'desc' },
    });

    let nextNum = 1;
    if (lastBatch && lastBatch.batchNumber) {
      const parts = lastBatch.batchNumber.split('-');
      if (parts.length === 3) {
        const lastNum = parseInt(parts[2]);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
    }

    return `BATCH-${datePrefix}-${nextNum.toString().padStart(4, '0')}`;
  } catch (error: unknown) {
    console.error('Error generating batch number:', error instanceof Error ? error.message : String(error));
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const yy = date.getFullYear().toString().slice(-2);
    const datePrefix = `${mm}${dd}${yy}`;
    const timestamp = Date.now().toString().slice(-4);
    return `BATCH-${datePrefix}-${timestamp}`;
  }
}

export async function getProductionBatches(): Promise<ProductionBatchWithProduct[]> {
  try {
    const batches = await prisma.productionBatch.findMany({
      where: { deletedAt: null },
      include: {
        product: { select: { id: true, name: true, size: true, unit: true } },
        batchItems: true,
        qualityChecks: { select: { id: true, overallScore: true, passed: true, checkedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    if (!batches || batches.length === 0) {
      return [];
    }

    return batches.map((b) => ({
      ...b,
      product: b.product ? {
        ...b.product,
        size: b.product.size ? Number(b.product.size) : null,
      } : null,
      targetQty: b.targetQty?.toNumber() || 0,
      actualQty: b.actualQty?.toNumber() ?? null,
      yieldPercent: b.yieldPercent?.toNumber() ?? null,
      batchItems: b.batchItems?.map((item) => ({
        ...item,
        quantityUsed: item.quantityUsed?.toNumber() || 0,
      })) || [],
    }));
  } catch (error: unknown) {
    console.error('Error fetching production batches:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function getProductionBatchById(id: string) {
  try {
    const batch = await prisma.productionBatch.findFirst({
      where: { id, deletedAt: null },
      include: {
        product: true,
        batchItems: true,
        qualityChecks: true,
      },
    });

    if (!batch) return null;

    return {
      ...batch,
      product: batch.product ? {
        ...batch.product,
        size: (batch.product as any).size ? Number((batch.product as any).size) : null,
        unit: (batch.product as any).unit || null,
      } : null,
      targetQty: batch.targetQty?.toNumber() || 0,
      actualQty: batch.actualQty?.toNumber() || null,
      yieldPercent: batch.yieldPercent?.toNumber() || null,
      batchItems: batch.batchItems?.map((item: any) => ({
        ...item,
        quantityUsed: item.quantityUsed?.toNumber() || 0,
      })) || [],
      qualityChecks: batch.qualityChecks?.map((qc) => ({
        ...qc,
        overallScore: qc.overallScore || 0,
      })) || [],
    };
  } catch (error: unknown) {
    console.error('Error fetching batch:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function createProductionBatch(data: {
  productId: string;
  targetQty: number;
  status?: string;
  startDate: Date;
  producedBy?: string;
  notes?: string;
  batchItems?: { rawMaterialId: string; materialName: string; quantityUsed: number }[];
}) {
  try {
    const parsedData = createBatchSchema.safeParse(data);
    if (!parsedData.success) {
      return { success: false, error: parsedData.error.issues[0].message };
    }

    const validData = parsedData.data;
    const batchNumber = await generateBatchNumber(validData.startDate);

    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await tx.productionBatch.create({
        data: {
          batchNumber,
          productId: validData.productId,
          targetQty: validData.targetQty,
          status: validData.status || 'planned',
          startDate: validData.startDate,
          producedBy: validData.producedBy,
          notes: validData.notes,
          batchItems: data.batchItems && data.batchItems.length > 0 ? {
            create: data.batchItems.map(item => ({
              rawMaterialId: item.rawMaterialId || null,
              materialName: item.materialName,
              quantityUsed: item.quantityUsed,
            })),
          } : undefined,
        },
      });

      // Create audit log
      await createAuditLog(tx, {
        action: 'CREATE',
        entity: 'ProductionBatch',
        entityId: newBatch.batchNumber,
        details: { after: validData }
      });

      return newBatch;
    });

    const serializedBatch = {
      ...batch,
      targetQty: batch.targetQty?.toNumber() || 0,
      actualQty: batch.actualQty?.toNumber() || null,
      yieldPercent: batch.yieldPercent?.toNumber() || null,
    };

    revalidatePath('/production/batches');
    revalidatePath('/');
    return { success: true, data: serializedBatch };
  } catch (error: unknown) {
    console.error('Error creating batch:', error instanceof Error ? error.message : String(error));
    let errorMessage = 'Failed to create batch';

    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      errorMessage = 'Invalid product selected. Please select a valid product.';
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }

    return { success: false, error: errorMessage };
  }
}

export async function updateProductionBatch(id: string, data: {
  status?: string;
  producedBy?: string;
  notes?: string;
}) {
  try {
    const parsedData = updateBatchSchema.safeParse(data);
    if (!parsedData.success) {
      return { success: false, error: parsedData.error.issues[0].message };
    }
    const validData = parsedData.data;

    if (validData.status === 'completed' || validData.status === 'failed') {
      return { success: false, error: 'Status can only be set to Completed or Failed via Quality Control.' };
    }

    const batch = await prisma.$transaction(async (tx) => {
      const updatedBatch = await tx.productionBatch.update({
        where: { id },
        data: {
          ...validData,
        },
      });

      // Create audit log
      await createAuditLog(tx, {
        action: 'UPDATE',
        entity: 'ProductionBatch',
        entityId: updatedBatch.batchNumber,
        details: { after: validData }
      });

      return updatedBatch;
    });

    const serializedBatch = {
      ...batch,
      targetQty: batch.targetQty?.toNumber() || 0,
      actualQty: batch.actualQty?.toNumber() || null,
      yieldPercent: batch.yieldPercent?.toNumber() || null,
    };

    revalidatePath('/production/batches');
    revalidatePath('/production/quality');
    revalidatePath('/');
    return { success: true, data: serializedBatch };
  } catch (error) {
    console.error('Error updating batch:', error);
    return { success: false, error: 'Failed to update batch' };
  }
}

export async function deleteProductionBatch(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const deletedBatch = await tx.productionBatch.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      // Create audit log
      await createAuditLog(tx, {
        action: 'SOFT_DELETE',
        entity: 'ProductionBatch',
        entityId: deletedBatch.batchNumber,
        details: { reason: 'User deleted batch' }
      });
    });
    revalidatePath('/production/batches');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting batch:', error);
    return { success: false, error: 'Failed to delete batch' };
  }
}

export async function getQualityChecks() {
  try {
    const checks = await prisma.qualityCheck.findMany({
      include: {
        batch: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { checkedAt: 'desc' },
    });
    // Convert Decimal to Number for client serialization
    return checks.map(c => ({
      ...c,
      batch: c.batch ? {
        ...c.batch,
        targetQty: c.batch.targetQty ? Number(c.batch.targetQty) : 0,
        actualQty: c.batch.actualQty ? Number(c.batch.actualQty) : null,
        yieldPercent: c.batch.yieldPercent ? Number(c.batch.yieldPercent) : null,
      } : c.batch,
    }));
  } catch (error) {
    console.error('Error fetching quality checks:', error);
    return [];
  }
}

export async function createQualityCheck(data: {
  batchId: string;
  actualQty: number;
  visualInspection: string;
  visualNotes?: string;
  weightVerification: string;
  weightNotes?: string;
  tasteTest: string;
  tasteNotes?: string;
  labAnalysis?: string;
  sfdaCompliance: string;
  overallScore: number;
  passed: boolean;
  checkedAt: Date;
  notes?: string;
}) {
  try {
    // Phase 7.3: Use transaction for QC + inventory automation
    console.log('[QC] Starting quality check transaction for batch:', data.batchId);

    return await prisma.$transaction(async (tx) => {
      // 1. Create QC record
      const { actualQty, ...qcData } = data;
      console.log('[QC] Creating QualityCheck record...');
      await tx.qualityCheck.create({ data: qcData });

      // Create audit log for QC
      console.log('[QC] Creating audit log...');
      const batchRef = await tx.productionBatch.findUnique({
        where: { id: data.batchId },
        select: { batchNumber: true, targetQty: true }
      });

      await createAuditLog(tx, {
        action: 'CREATE_QC',
        entity: 'ProductionBatch',
        entityId: batchRef?.batchNumber || data.batchId,
        details: { passed: data.passed, score: data.overallScore }
      });

      // 2. Update batch status and post-production fields
      const newStatus = data.passed ? 'completed' : 'failed';
      const targetQty = batchRef?.targetQty ? Number(batchRef.targetQty) : 0;
      const yieldPercent = targetQty > 0 ? (actualQty / targetQty) * 100 : 0;

      console.log('[QC] Updating batch status to:', newStatus, 'actualQty:', actualQty, 'yield:', yieldPercent);
      await tx.productionBatch.update({
        where: { id: data.batchId },
        data: {
          qualityScore: data.overallScore,
          status: newStatus,
          actualQty: actualQty,
          yieldPercent: yieldPercent,
          endDate: data.checkedAt,
        },
      });

      // 3. If PASSED — automate inventory updates
      if (data.passed) {
        console.log('[QC] Passed: Starting inventory synchronization...');
        const batch = await tx.productionBatch.findUnique({
          where: { id: data.batchId },
          include: {
            product: { include: { finishedProduct: true } },
            batchItems: true,
          },
        });

        if (!batch) {
          console.error('[QC] Batch not found inside transaction');
          throw new Error('Batch not found');
        }

        const year = new Date().getFullYear();
        // 3a. INCREASE Finished Product stock by actualQty
        let fp = batch.product?.finishedProduct;
        const qty = actualQty;

        if (qty > 0) {
          if (!fp) {
            console.log('[QC] Creating new FinishedProduct for SKU prefix:', batch.product?.skuPrefix);
            fp = await tx.finishedProduct.create({
              data: {
                productId: batch.productId,
                variant: 'Standard',
                sku: `FP-${batch.product?.skuPrefix || 'GEN'}-${Date.now().toString().slice(-4)}`,
                currentStock: qty,
                unitCost: Number(batch.product?.baseCost || 0),
                retailPrice: Number(batch.product?.baseRetailPrice || 0),
                location: 'AL_AHSA_WAREHOUSE',
                batchNumber: batch.batchNumber,
              },
            });
          } else {
            console.log('[QC] Incrementing existing FinishedProduct stock:', fp.id, 'by:', qty);
            await tx.finishedProduct.update({
              where: { id: fp.id },
              data: { currentStock: { increment: qty } },
            });
          }

          // Generate a more robust unique movement ID to avoid collisions
          const movementId = `SM-${year}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
          console.log('[QC] Creating stock movement (IN):', movementId);
          await tx.stockMovement.create({
            data: {
              movementId: movementId,
              type: 'STOCK_IN',
              reason: 'PURCHASE', // Closest enum for now
              quantity: qty,
              referenceId: batch.batchNumber,
              finishedProductId: fp.id,
              notes: `Auto: Production batch ${batch.batchNumber} completed`,
            },
          });
        }

        // 3b. DECREASE Raw Material stock for each BatchItem
        for (const item of batch.batchItems) {
          if (item.rawMaterialId) {
            const usedQty = Number(item.quantityUsed);
            console.log('[QC] Decrementing raw material:', item.rawMaterialId, 'by:', usedQty);
            await tx.rawMaterial.update({
              where: { id: item.rawMaterialId },
              data: { currentStock: { decrement: usedQty } },
            });

            // Generate another unique ID for the material reduction
            const matMovementId = `SM-${year}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
            console.log('[QC] Creating stock movement (OUT):', matMovementId);
            await tx.stockMovement.create({
              data: {
                movementId: matMovementId,
                type: 'STOCK_OUT',
                reason: 'PRODUCTION_INPUT',
                quantity: usedQty,
                referenceId: batch.batchNumber,
                rawMaterialId: item.rawMaterialId,
                notes: `Auto: ${item.materialName} consumed for batch ${batch.batchNumber}`,
              },
            });
          }
        }
      }

      console.log('[QC] Transaction successful!');
      revalidatePath('/production/quality');
      revalidatePath('/production/batches');
      revalidatePath('/inventory/finished');
      revalidatePath('/inventory/raw-materials');
      revalidatePath('/inventory');
      revalidatePath('/');
      return { success: true };
    }).catch(error => {
      console.error('[QC] Transaction failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create quality check' };
    });
  } catch (error) {
    console.error('Error creating quality check:', error);
    return { success: false, error: 'Failed to create quality check' };
  }
}

export async function updateQualityCheck(id: string, data: {
  visualInspection: string;
  visualNotes?: string;
  weightVerification: string;
  weightNotes?: string;
  tasteTest: string;
  tasteNotes?: string;
  labAnalysis?: string;
  sfdaCompliance: string;
  overallScore: number;
  passed: boolean;
  notes?: string;
}) {
  try {
    const existing = await prisma.qualityCheck.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'QC record not found.' };

    await prisma.$transaction(async (tx) => {
      // 1. Get current batch and product info for inventory automation
      const batch = await tx.productionBatch.findUnique({
        where: { id: existing.batchId },
        include: {
          product: { include: { finishedProduct: true } },
          batchItems: true,
        },
      });

      if (!batch) throw new Error('Batch not found');

      const oldPassed = existing.passed;
      const newPassed = data.passed;
      const actualQty = batch.actualQty ? Number(batch.actualQty) : 0;

      // 2. Update QC record
      await tx.qualityCheck.update({
        where: { id },
        data: {
          visualInspection: data.visualInspection,
          visualNotes: data.visualNotes || null,
          weightVerification: data.weightVerification,
          weightNotes: data.weightNotes || null,
          tasteTest: data.tasteTest,
          tasteNotes: data.tasteNotes || null,
          labAnalysis: data.labAnalysis || null,
          sfdaCompliance: data.sfdaCompliance,
          overallScore: data.overallScore,
          passed: data.passed,
          notes: data.notes || null,
        },
      });

      // Create audit log for QC update
      await createAuditLog(tx, {
        action: 'UPDATE_QC',
        entity: 'ProductionBatch',
        entityId: batch.batchNumber,
        details: { passed: data.passed, score: data.overallScore }
      });

      // 3. Update batch status
      await tx.productionBatch.update({
        where: { id: existing.batchId },
        data: {
          qualityScore: data.overallScore,
          status: newPassed ? 'completed' : 'failed',
        },
      });

      // 4. Handle Inventory Sync if pass status changed
      if (oldPassed !== newPassed && actualQty > 0) {
        const year = new Date().getFullYear();
        let counter = await tx.stockMovement.count({
          where: { movementId: { startsWith: `SM-${year}` } },
        });

        let fp = batch.product.finishedProduct;

        if (newPassed) {
          // FAILED -> PASSED: Increase Finished Product, Decrease Raw Materials
          if (!fp) {
            fp = await tx.finishedProduct.create({
              data: {
                productId: batch.productId,
                variant: 'Standard',
                sku: `fp-${batch.product.skuPrefix}-${Date.now().toString().slice(-4)}`,
                currentStock: actualQty,
                unitCost: Number(batch.product.baseCost),
                retailPrice: Number(batch.product.baseRetailPrice),
                location: 'AL_AHSA_WAREHOUSE',
                batchNumber: batch.batchNumber,
              },
            });
          } else {
            await tx.finishedProduct.update({
              where: { id: fp.id },
              data: { currentStock: { increment: actualQty } },
            });
          }

          counter++;
          await tx.stockMovement.create({
            data: {
              movementId: `SM-${year}-${String(counter).padStart(4, '0')}`,
              type: 'STOCK_IN',
              reason: 'PURCHASE',
              quantity: actualQty,
              referenceId: batch.batchNumber,
              finishedProductId: fp.id,
              notes: `Auto: QC update (Fail -> Pass) for batch ${batch.batchNumber}`,
            },
          });

          // Decrease Raw Materials
          for (const item of batch.batchItems) {
            if (item.rawMaterialId) {
              await tx.rawMaterial.update({
                where: { id: item.rawMaterialId },
                data: { currentStock: { decrement: Number(item.quantityUsed) } },
              });
              counter++;
              await tx.stockMovement.create({
                data: {
                  movementId: `SM-${year}-${String(counter).padStart(4, '0')}`,
                  type: 'STOCK_OUT',
                  reason: 'PRODUCTION_INPUT',
                  quantity: Number(item.quantityUsed),
                  referenceId: batch.batchNumber,
                  rawMaterialId: item.rawMaterialId,
                  notes: `Auto: Consumption sync (QC update) for batch ${batch.batchNumber}`,
                },
              });
            }
          }
        } else {
          // PASSED -> FAILED: Decrease Finished Product, Increase Raw Materials
          if (fp) {
            await tx.finishedProduct.update({
              where: { id: fp.id },
              data: { currentStock: { decrement: actualQty } },
            });

            counter++;
            await tx.stockMovement.create({
              data: {
                movementId: `SM-${year}-${String(counter).padStart(4, '0')}`,
                type: StockMovementType.STOCK_OUT,
                reason: StockMovementReason.DAMAGE, // Closest reversal/adjustment
                quantity: actualQty,
                referenceId: batch.batchNumber,
                finishedProductId: fp.id,
                notes: `Auto: QC update (Pass -> Fail) reversal for batch ${batch.batchNumber}`,
              },
            });
          }

          // Increase Raw Materials
          for (const item of batch.batchItems) {
            if (item.rawMaterialId) {
              await tx.rawMaterial.update({
                where: { id: item.rawMaterialId },
                data: { currentStock: { increment: Number(item.quantityUsed) } },
              });
              counter++;
              await tx.stockMovement.create({
                data: {
                  movementId: `SM-${year}-${String(counter).padStart(4, '0')}`,
                  type: StockMovementType.STOCK_IN,
                  reason: StockMovementReason.PRODUCTION_INPUT, // Reversing consumption
                  quantity: Number(item.quantityUsed),
                  referenceId: batch.batchNumber,
                  rawMaterialId: item.rawMaterialId,
                  notes: `Auto: Consumption reversal (QC update) for batch ${batch.batchNumber}`,
                },
              });
            }
          }
        }
      }
    });

    revalidatePath('/production/quality');
    revalidatePath('/production/batches');
    revalidatePath('/inventory/finished');
    revalidatePath('/inventory/raw-materials');
    revalidatePath('/inventory');
    revalidatePath('/');

    revalidatePath('/production/quality');
    revalidatePath('/production/batches');
    return { success: true };
  } catch (error) {
    console.error('Error updating quality check:', error);
    return { success: false, error: 'Failed to update quality check.' };
  }
}

export async function deleteQualityCheck(id: string) {
  try {
    const existing = await prisma.qualityCheck.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'QC record not found.' };

    await prisma.$transaction(async (tx) => {
      // 1. Get current batch and product info for inventory reversal
      const batch = await tx.productionBatch.findUnique({
        where: { id: existing.batchId },
        include: {
          product: { include: { finishedProduct: true } },
          batchItems: true,
        },
      });

      if (!batch) throw new Error('Batch not found');

      const wasPassed = existing.passed;
      const actualQty = batch.actualQty ? Number(batch.actualQty) : 0;

      // 2. Delete QC record
      await tx.qualityCheck.delete({ where: { id } });

      // 3. Revert batch status back to quality_check so it can be re-inspected
      await tx.productionBatch.update({
        where: { id: existing.batchId },
        data: {
          status: 'quality_check',
          qualityScore: null,
        },
      });

      // 4. Handle Inventory Reversal if it was passed
      if (wasPassed && actualQty > 0) {
        const year = new Date().getFullYear();
        let counter = await tx.stockMovement.count({
          where: { movementId: { startsWith: `SM-${year}` } },
        });

        const fp = batch.product.finishedProduct;

        // Decrease Finished Product
        if (fp) {
          await tx.finishedProduct.update({
            where: { id: fp.id },
            data: { currentStock: { decrement: actualQty } },
          });

          counter++;
          await tx.stockMovement.create({
            data: {
              movementId: `SM-${year}-${String(counter).padStart(4, '0')}`,
              type: StockMovementType.STOCK_OUT,
              reason: StockMovementReason.DAMAGE,
              quantity: actualQty,
              referenceId: batch.batchNumber,
              finishedProductId: fp.id,
              notes: `Auto: Reversal due to QC deletion for batch ${batch.batchNumber}`,
            },
          });
        }

        // Increase Raw Materials
        for (const item of batch.batchItems) {
          if (item.rawMaterialId) {
            await tx.rawMaterial.update({
              where: { id: item.rawMaterialId },
              data: { currentStock: { increment: Number(item.quantityUsed) } },
            });
            counter++;
            await tx.stockMovement.create({
              data: {
                movementId: `SM-${year}-${String(counter).padStart(4, '0')}`,
                type: StockMovementType.STOCK_IN,
                reason: StockMovementReason.PRODUCTION_INPUT, // Reversing consumption
                quantity: Number(item.quantityUsed),
                referenceId: batch.batchNumber,
                rawMaterialId: item.rawMaterialId,
                notes: `Auto: Consumption reversal (QC deletion) for batch ${batch.batchNumber}`,
              },
            });
          }
        }
      }
    });

    revalidatePath('/production/quality');
    revalidatePath('/production/batches');
    revalidatePath('/inventory/finished');
    revalidatePath('/inventory/raw-materials');
    revalidatePath('/inventory');
    revalidatePath('/');

    revalidatePath('/production/quality');
    revalidatePath('/production/batches');
    return { success: true };
  } catch (error) {
    console.error('Error deleting quality check:', error);
    return { success: false, error: 'Failed to delete quality check.' };
  }
}

export type RndProjectType = {
  id: string;
  name: string;
  category: string;
  status: string;
  formulationDetails: string | null;
  testResults: string | null;
  costEstimate: number | null;
  targetLaunchDate: Date | null;
  leadId: string | null;
  relatedSuppliers: Prisma.JsonValue | null;
  attachments: Prisma.JsonValue | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getRnDProjects(search?: string): Promise<RndProjectType[]> {
  try {
    const whereClause = search
      ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { category: { contains: search, mode: 'insensitive' as const } }
        ]
      }
      : {};

    const projects = await prisma.rndProject.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
    return projects.map((p) => ({
      ...p,
      costEstimate: p.costEstimate?.toNumber() ?? null,
      leadId: p.leadId || null,
      relatedSuppliers: p.relatedSuppliers || null,
      attachments: p.attachments || null,
    }));
  } catch (error) {
    console.error('Error fetching R&D projects:', error);
    return [];
  }
}

export async function createRnDProject(data: {
  name: string;
  category: string;
  status?: string;
  formulationDetails?: string;
  testResults?: string;
  costEstimate?: number;
  targetLaunchDate?: Date;
  leadId?: string;
  relatedSuppliers?: Prisma.InputJsonValue;
  attachments?: Prisma.InputJsonValue;
  notes?: string;
}) {
  try {
    const project = await prisma.rndProject.create({
      data: {
        name: data.name,
        category: data.category,
        status: (data.status as RndStatus) || 'ideation',
        formulationDetails: data.formulationDetails,
        testResults: data.testResults,
        costEstimate: data.costEstimate,
        targetLaunchDate: data.targetLaunchDate,
        leadId: data.leadId,
        relatedSuppliers: data.relatedSuppliers ?? undefined,
        attachments: data.attachments ?? undefined,
        notes: data.notes,
      },
    });
    revalidatePath('/production/rnd');
    revalidatePath('/');
    return { success: true, data: project };
  } catch (error) {
    console.error('Error creating R&D project:', error);
    return { success: false, error: 'Failed to create project' };
  }
}

export async function updateRnDProject(id: string, data: {
  name?: string;
  category?: string;
  status?: 'ideation' | 'formulation' | 'testing' | 'sfda_submission' | 'approved' | 'archived';
  formulationDetails?: string;
  testResults?: string;
  costEstimate?: number;
  targetLaunchDate?: Date;
  leadId?: string;
  relatedSuppliers?: Prisma.InputJsonValue;
  attachments?: Prisma.InputJsonValue;
  notes?: string;
}) {
  try {
    const project = await prisma.rndProject.update({
      where: { id },
      data: {
        ...data,
        status: data.status,
      },
    });
    revalidatePath('/production/rnd');
    revalidatePath('/');
    return { success: true, data: project };
  } catch (error) {
    console.error('Error updating R&D project:', error);
    return { success: false, error: 'Failed to update project' };
  }
}

export async function deleteRnDProject(id: string) {
  try {
    await prisma.rndProject.delete({ where: { id } });
    revalidatePath('/production/rnd');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting R&D project:', error);
    return { success: false, error: 'Failed to delete project' };
  }
}

export async function getSystemSettings() {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { productionCapacityKg: 3000 },
      });
    }
    return settings;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return { productionCapacityKg: 3000 };
  }
}

export async function updateSystemCapacity(capacityKg: number) {
  try {
    const settings = await prisma.systemSettings.findFirst();
    if (settings) {
      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { productionCapacityKg: capacityKg },
      });
    } else {
      await prisma.systemSettings.create({
        data: { productionCapacityKg: capacityKg },
      });
    }
    revalidatePath('/production');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating capacity:', error);
    return { success: false, error: 'Failed to update capacity' };
  }
}
