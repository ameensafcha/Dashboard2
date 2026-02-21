'use server';

import prisma from '@/lib/prisma';
import { Prisma, BatchStatus, RndStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createBatchSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  targetQty: z.number().positive('Target quantity must be greater than zero'),
  actualQty: z.number().nonnegative('Actual quantity cannot be negative').optional(),
  status: z.nativeEnum(BatchStatus).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  qualityScore: z.number().min(0).max(10).optional(),
  producedBy: z.string().optional(),
  notes: z.string().optional(),
});

const updateBatchSchema = z.object({
  actualQty: z.number().nonnegative('Actual quantity cannot be negative').optional(),
  status: z.nativeEnum(BatchStatus).optional(),
  qualityScore: z.number().min(0).max(10).optional(),
  endDate: z.date().optional(),
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
  qualityChecks: { id: string; overallScore: number; passed: boolean; checkedAt: Date }[];
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
      include: {
        product: { select: { id: true, name: true, size: true, unit: true } },
        batchItems: true,
        qualityChecks: { select: { id: true, overallScore: true, passed: true, checkedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!batches || batches.length === 0) {
      return [];
    }

    return batches.map((b: any) => ({
      ...b,
      product: b.product ? {
        ...b.product,
        size: b.product.size ? Number(b.product.size) : null,
      } : null,
      targetQty: b.targetQty?.toNumber() || 0,
      actualQty: b.actualQty?.toNumber() ?? null,
      yieldPercent: b.yieldPercent?.toNumber() ?? null,
      batchItems: b.batchItems?.map((item: any) => ({
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
    const batch = await prisma.productionBatch.findUnique({
      where: { id },
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
      qualityChecks: batch.qualityChecks?.map((qc: any) => ({
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
  actualQty?: number;
  status?: string;
  startDate: Date;
  endDate?: Date;
  qualityScore?: number;
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

    const yieldPercent = (validData.actualQty && validData.targetQty > 0)
      ? (validData.actualQty / validData.targetQty) * 100
      : undefined;

    const batch = await prisma.productionBatch.create({
      data: {
        batchNumber,
        productId: validData.productId,
        targetQty: validData.targetQty,
        actualQty: validData.actualQty,
        yieldPercent: yieldPercent,
        status: validData.status || 'planned',
        startDate: validData.startDate,
        endDate: validData.endDate,
        qualityScore: validData.qualityScore,
        producedBy: validData.producedBy,
        notes: validData.notes,
        // Phase 7.1: Create batch items (raw material consumption)
        batchItems: data.batchItems && data.batchItems.length > 0 ? {
          create: data.batchItems.map(item => ({
            rawMaterialId: item.rawMaterialId || null,
            materialName: item.materialName,
            quantityUsed: item.quantityUsed,
          })),
        } : undefined,
      },
    });

    const serializedBatch = {
      ...batch,
      targetQty: batch.targetQty?.toNumber() || 0,
      actualQty: batch.actualQty?.toNumber() || null,
      yieldPercent: batch.yieldPercent?.toNumber() || null,
    };

    revalidatePath('/production/batches');
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
  actualQty?: number;
  status?: string;
  qualityScore?: number;
  endDate?: Date;
  producedBy?: string;
  notes?: string;
}) {
  try {
    const parsedData = updateBatchSchema.safeParse(data);
    if (!parsedData.success) {
      return { success: false, error: parsedData.error.issues[0].message };
    }
    const validData = parsedData.data;

    const currentBatch = await prisma.productionBatch.findUnique({ where: { id } });
    const targetQty = currentBatch ? Number(currentBatch.targetQty) : 0;

    // Calculate new yield if actualQty is provided
    let newYieldPercent: number | undefined;
    if (validData.actualQty !== undefined && targetQty > 0) {
      newYieldPercent = (validData.actualQty / targetQty) * 100;
    }

    const batch = await prisma.productionBatch.update({
      where: { id },
      data: {
        ...validData,
        yieldPercent: newYieldPercent,
        status: validData.status,
      },
    });

    const serializedBatch = {
      ...batch,
      targetQty: batch.targetQty?.toNumber() || 0,
      actualQty: batch.actualQty?.toNumber() || null,
      yieldPercent: batch.yieldPercent?.toNumber() || null,
    };

    revalidatePath('/production/batches');
    return { success: true, data: serializedBatch };
  } catch (error) {
    console.error('Error updating batch:', error);
    return { success: false, error: 'Failed to update batch' };
  }
}

export async function deleteProductionBatch(id: string) {
  try {
    await prisma.productionBatch.delete({ where: { id } });
    revalidatePath('/production/batches');
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
    await prisma.$transaction(async (tx) => {
      // 1. Create QC record
      await tx.qualityCheck.create({ data });

      // 2. Update batch status
      const newStatus = data.passed ? 'completed' : 'failed';
      await tx.productionBatch.update({
        where: { id: data.batchId },
        data: {
          qualityScore: data.overallScore,
          status: newStatus,
        },
      });

      // 3. If PASSED — automate inventory updates
      if (data.passed) {
        const batch = await tx.productionBatch.findUnique({
          where: { id: data.batchId },
          include: {
            product: { include: { finishedProduct: true } },
            batchItems: true,
          },
        });

        if (!batch) return;

        const year = new Date().getFullYear();
        let counter = await tx.stockMovement.count({
          where: { movementId: { startsWith: `SM-${year}` } },
        });

        // 3a. INCREASE Finished Product stock by actualQty
        const fp = batch.product.finishedProduct;
        if (fp && batch.actualQty) {
          const qty = Number(batch.actualQty);
          await tx.finishedProduct.update({
            where: { id: fp.id },
            data: { currentStock: { increment: qty } },
          });

          counter++;
          await tx.stockMovement.create({
            data: {
              movementId: `SM-${year}-${String(counter).padStart(4, '0')}`,
              type: 'STOCK_IN',
              reason: 'PURCHASE', // closest enum for production output
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
            await tx.rawMaterial.update({
              where: { id: item.rawMaterialId },
              data: { currentStock: { decrement: usedQty } },
            });

            counter++;
            await tx.stockMovement.create({
              data: {
                movementId: `SM-${year}-${String(counter).padStart(4, '0')}`,
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
    });

    revalidatePath('/production/quality');
    revalidatePath('/production/batches');
    revalidatePath('/inventory/finished');
    revalidatePath('/inventory/raw-materials');
    return { success: true };
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

      // Update batch status based on new pass/fail
      await tx.productionBatch.update({
        where: { id: existing.batchId },
        data: {
          qualityScore: data.overallScore,
          status: data.passed ? 'completed' : 'failed',
        },
      });
    });

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
      await tx.qualityCheck.delete({ where: { id } });

      // Revert batch status back to quality_check so it can be re-inspected
      await tx.productionBatch.update({
        where: { id: existing.batchId },
        data: {
          status: 'quality_check',
          qualityScore: null,
        },
      });
    });

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
    return { success: true };
  } catch (error) {
    console.error('Error deleting R&D project:', error);
    return { success: false, error: 'Failed to delete project' };
  }
}

export async function getSystemSettings() {
  try {
    let settings = await (prisma as any).systemSettings.findFirst();
    if (!settings) {
      settings = await (prisma as any).systemSettings.create({
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
    return { success: true };
  } catch (error) {
    console.error('Error updating capacity:', error);
    return { success: false, error: 'Failed to update capacity' };
  }
}
