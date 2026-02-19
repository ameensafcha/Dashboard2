'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type ProductionBatchWithProduct = {
  id: string;
  batchNumber: string;
  productId: string;
  variantId: string | null;
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
  product: { id: string; name: string } | null;
  variant: { id: string; name: string } | null;
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
  } catch (error: any) {
    console.error('Error generating batch number:', error?.message || error);
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
        product: { select: { id: true, name: true } },
        variant: { select: { id: true, name: true } },
        batchItems: true,
        qualityChecks: { select: { id: true, overallScore: true, passed: true, checkedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!batches || batches.length === 0) {
      return [];
    }

    return batches.map(b => ({
      ...b,
      targetQty: b.targetQty?.toNumber() || 0,
      actualQty: b.actualQty?.toNumber() ?? null,
      yieldPercent: b.yieldPercent?.toNumber() ?? null,
      batchItems: b.batchItems?.map(item => ({
        ...item,
        quantityUsed: item.quantityUsed?.toNumber() || 0,
      })) || [],
    }));
  } catch (error: any) {
    console.error('Error fetching production batches:', error?.message || error);
    return [];
  }
}

export async function getProductionBatchById(id: string) {
  try {
    const batch = await prisma.productionBatch.findUnique({
      where: { id },
      include: {
        product: true,
        variant: true,
        batchItems: true,
        qualityChecks: true,
      },
    });

    if (!batch) return null;

    return {
      ...batch,
      targetQty: batch.targetQty?.toNumber() || 0,
      actualQty: batch.actualQty?.toNumber() || null,
      yieldPercent: batch.yieldPercent?.toNumber() || null,
      batchItems: batch.batchItems?.map(item => ({
        ...item,
        quantityUsed: item.quantityUsed?.toNumber() || 0,
      })) || [],
      qualityChecks: batch.qualityChecks?.map(qc => ({
        ...qc,
        overallScore: qc.overallScore || 0,
      })) || [],
    };
  } catch (error: any) {
    console.error('Error fetching batch:', error?.message || error);
    return null;
  }
}

export async function createProductionBatch(data: {
  productId: string;
  variantId?: string;
  targetQty: number;
  actualQty?: number;
  status?: string;
  startDate: Date;
  endDate?: Date;
  qualityScore?: number;
  producedBy?: string;
  notes?: string;
}) {
  try {
    if (!data.productId) {
      return { success: false, error: 'Product is required' };
    }

    const batchNumber = await generateBatchNumber(data.startDate);

    const batch = await prisma.productionBatch.create({
      data: {
        batchNumber,
        productId: data.productId,
        variantId: data.variantId,
        targetQty: data.targetQty,
        actualQty: data.actualQty,
        status: data.status as any || 'planned',
        startDate: data.startDate,
        endDate: data.endDate,
        qualityScore: data.qualityScore,
        producedBy: data.producedBy,
        notes: data.notes,
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
  } catch (error: any) {
    console.error('Error creating batch:', error?.message || error);
    let errorMessage = 'Failed to create batch';

    if (error?.message?.includes('Foreign key constraint')) {
      errorMessage = 'Invalid product selected. Please select a valid product.';
    } else if (error?.message) {
      errorMessage = error.message;
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
    const batch = await prisma.productionBatch.update({
      where: { id },
      data: {
        ...data,
        status: data.status as any,
      },
    });
    revalidatePath('/production/batches');
    return { success: true, data: batch };
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
    return checks;
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
    const check = await prisma.qualityCheck.create({ data });

    await prisma.productionBatch.update({
      where: { id: data.batchId },
      data: {
        qualityScore: data.overallScore,
        status: data.passed ? 'quality_check' : 'failed',
      },
    });

    revalidatePath('/production/quality');
    return { success: true, data: check };
  } catch (error) {
    console.error('Error creating quality check:', error);
    return { success: false, error: 'Failed to create quality check' };
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
  relatedSuppliers: any | null;
  attachments: any | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getRnDProjects(): Promise<RndProjectType[]> {
  try {
    const projects = await prisma.rndProject.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return projects.map((p: any) => ({
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
  relatedSuppliers?: any;
  attachments?: any;
  notes?: string;
}) {
  try {
    const project = await prisma.rndProject.create({
      data: {
        name: data.name,
        category: data.category,
        status: data.status as any || 'ideation',
        formulationDetails: data.formulationDetails,
        testResults: data.testResults,
        costEstimate: data.costEstimate,
        targetLaunchDate: data.targetLaunchDate,
        leadId: data.leadId,
        relatedSuppliers: data.relatedSuppliers ?? undefined,
        attachments: data.attachments ?? undefined,
        notes: data.notes,
      } as any,
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
  relatedSuppliers?: any;
  attachments?: any;
  notes?: string;
}) {
  try {
    const project = await prisma.rndProject.update({
      where: { id },
      data: data as any,
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
