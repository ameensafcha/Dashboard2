'use client';

import { useEffect, useState } from 'react';
import { getProducts, ProductsResponse } from '@/app/actions/product/actions';
import { getProductionBatches, createProductionBatch, ProductionBatchWithProduct } from '@/app/actions/production';
import { getRawMaterials } from '@/app/actions/inventory/raw-materials';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useProductionStore } from '@/stores/productionStore';
import { useTranslation } from '@/lib/i18n';
import { Trash2, Edit2, Save, Plus, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateProductionBatch, deleteProductionBatch } from '@/app/actions/production';

const statusColors: Record<string, string> = {
  planned: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  quality_check: 'bg-purple-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

export default function ProductionBatchesPage() {
  const { t } = useTranslation();
  const {
    batches,
    products,
    isModalOpen,
    selectedBatch,
    isDetailOpen,
    isEditingBatch,
    isDeleteDialogOpen,
    formData,
    isSaving,
    setBatches,
    setProducts,
    setIsModalOpen,
    setSelectedBatch,
    setIsDetailOpen,
    setFormData,
    resetForm,
    setIsSaving,
    setIsEditingBatch,
    setIsDeleteDialogOpen,
  } = useProductionStore();

  // Raw material rows for batch creation
  type MaterialRow = { rawMaterialId: string; materialName: string; quantityUsed: number };
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
  const [rawMaterials, setRawMaterials] = useState<{ id: string; name: string; currentStock: number }[]>([]);

  const loadData = async () => {
    const [batchesData, productsData, rmData] = await Promise.all([
      getProductionBatches(),
      getProducts({ page: 1, limit: 100, search: '', status: '' }) as Promise<ProductsResponse>,
      getRawMaterials(),
    ]);
    setBatches(batchesData);
    setProducts(productsData.products || []);
    if (rmData.success && rmData.materials) {
      setRawMaterials(rmData.materials.map((m: any) => ({ id: m.id, name: m.name, currentStock: m.currentStock })));
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!formData.productId || formData.targetQty <= 0) {
      toast({ title: 'Error', description: 'Please fill required fields', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const result = await createProductionBatch({
        productId: formData.productId,
        targetQty: formData.targetQty,
        actualQty: formData.actualQty > 0 ? formData.actualQty : undefined,
        status: formData.status,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        qualityScore: formData.qualityScore >= 1 && formData.qualityScore <= 10 ? formData.qualityScore : undefined,
        producedBy: formData.producedBy || undefined,
        notes: formData.notes || undefined,
        batchItems: materialRows.filter(r => r.rawMaterialId && r.quantityUsed > 0),
      });

      if (result.success) {
        toast({ title: 'Success', description: 'Batch created successfully' });
        setIsModalOpen(false);
        resetForm();
        setMaterialRows([]);
        loadData();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to create batch', type: 'error' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowClick = (batch: ProductionBatchWithProduct) => {
    setSelectedBatch(batch);
    setFormData({
      status: batch.status,
      targetQty: batch.targetQty as number,
      actualQty: batch.actualQty || 0,
      qualityScore: batch.qualityScore || 0,
      producedBy: batch.producedBy || '',
      notes: batch.notes || '',
      endDate: batch.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : '',
    });
    setIsEditingBatch(false);
    setIsDetailOpen(true);
  };

  const handleUpdateBatch = async () => {
    if (!selectedBatch) return;
    setIsSaving(true);
    try {
      const result = await updateProductionBatch(selectedBatch.id, {
        status: formData.status,
        actualQty: formData.actualQty > 0 ? formData.actualQty : undefined,
        qualityScore: formData.qualityScore > 0 ? formData.qualityScore : undefined,
        producedBy: formData.producedBy || undefined,
        notes: formData.notes || undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });

      if (result.success) {
        toast({ title: 'Success', description: 'Batch updated successfully' });
        setIsEditingBatch(false);
        loadData();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update batch', type: 'error' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!selectedBatch) return;
    setIsSaving(true);
    try {
      const result = await deleteProductionBatch(selectedBatch.id);
      if (result.success) {
        toast({ title: 'Deleted', description: 'Batch removed successfully' });
        setIsDeleteDialogOpen(false);
        setIsDetailOpen(false);
        loadData();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to delete batch', type: 'error' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader title={t.productionBatches} />
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#E8A838] hover:bg-[#d49a2d] text-black">
          <Plus className="w-4 h-4 mr-2" />
          {t.addBatch}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <table className="w-full min-w-[800px]">
            <thead style={{ background: 'var(--muted)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t.batchNo}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t.product}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold hidden md:table-cell">{t.targetQty}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold hidden lg:table-cell">{t.actualQty}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold hidden lg:table-cell">{t.yield}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t.status}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold hidden sm:table-cell">{t.startDate}</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    No production batches yet
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="border-t cursor-pointer hover:bg-muted/50 transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => handleRowClick(batch)}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{batch.batchNumber}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                      {batch.product?.name || '-'}
                      {batch.product?.size ? <span className="text-xs ml-2 bg-muted-foreground/20 text-foreground px-1.5 py-0.5 rounded-md">{batch.product.size} {batch.product.unit || 'gm'}</span> : ''}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--foreground)' }}>{batch.targetQty}</td>
                    <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--foreground)' }}>{batch.actualQty ?? '-'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--foreground)' }}>
                      {batch.yieldPercent ? `${batch.yieldPercent.toFixed(1)}%` :
                        (batch.actualQty && batch.targetQty) ? `${((Number(batch.actualQty) / Number(batch.targetQty)) * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusColors[batch.status]} text-white`}>
                        {batch.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--foreground)' }}>
                      {new Date(batch.startDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Batch Modal - Each input in own row */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.createNewBatch}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">

            <div>
              <Label>{t.product} *</Label>
              <Select value={formData.productId} onValueChange={(v) => setFormData({ productId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t.status}</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="quality_check">Quality Check</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t.targetQtyKg} *</Label>
              <Input
                type="number"
                value={formData.targetQty || ''}
                onChange={(e) => setFormData({ targetQty: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.1}
                placeholder="Planned production amount"
              />
            </div>

            <div>
              <Label>{t.actualQtyKg}</Label>
              <Input
                type="number"
                value={formData.actualQty || ''}
                onChange={(e) => setFormData({ actualQty: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.1}
                placeholder="Actual output after production"
              />
            </div>

            <div>
              <Label>{t.qualityScore} (1-10)</Label>
              <Input
                type="number"
                value={formData.qualityScore || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (val >= 0 && val <= 10) {
                    setFormData({ qualityScore: val });
                  }
                }}
                min={0}
                max={10}
                placeholder="QC rating after quality check"
              />
            </div>

            <div>
              <Label>{t.startDate}</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ startDate: e.target.value })}
              />
            </div>

            <div>
              <Label>{t.endDate}</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ endDate: e.target.value })}
              />
            </div>

            <div>
              <Label>{t.producedBy}</Label>
              <Input
                value={formData.producedBy}
                onChange={(e) => setFormData({ producedBy: e.target.value })}
                placeholder="Production manager name"
              />
            </div>

            <div>
              <Label>{t.notes}</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ notes: e.target.value })}
                placeholder="Production notes, issues encountered"
              />
            </div>

            {/* Raw Materials Used (Phase 7.1) */}
            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">Raw Materials Used</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setMaterialRows(prev => [...prev, { rawMaterialId: '', materialName: '', quantityUsed: 0 }])}>
                  <Plus className="w-3 h-3 mr-1" /> Add Material
                </Button>
              </div>
              {materialRows.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No raw materials added. Click &quot;Add Material&quot; to track consumption.</p>
              )}
              {materialRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <Select value={row.rawMaterialId} onValueChange={(v) => {
                    const mat = rawMaterials.find(m => m.id === v);
                    setMaterialRows(prev => prev.map((r, i) => i === idx ? { ...r, rawMaterialId: v, materialName: mat?.name || '' } : r));
                  }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {rawMaterials.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.currentStock} kg)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Qty (kg)"
                    className="w-24"
                    value={row.quantityUsed || ''}
                    min={0}
                    step={0.1}
                    onChange={(e) => setMaterialRows(prev => prev.map((r, i) => i === idx ? { ...r, quantityUsed: parseFloat(e.target.value) || 0 } : r))}
                  />
                  <button type="button" onClick={() => setMaterialRows(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-red-500/10 text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>{t.cancel}</Button>
              <Button onClick={handleSubmit} disabled={isSaving} className="bg-[#E8A838] hover:bg-[#d49a2d] text-black">
                {isSaving ? '...' : t.createBatch}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => {
        setIsDetailOpen(open);
        if (!open) setIsEditingBatch(false);
      }}>
        <DialogContent className="sm:max-w-4xl p-0 border-0 overflow-hidden shadow-2xl rounded-2xl bg-[#ffffff] dark:bg-[#1E1E1E]">
          {/* Header Region */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-3 text-gray-900 dark:text-gray-100 mb-1">
                {t.batchDetails} <span className="text-gray-300 dark:text-gray-700">|</span> {selectedBatch?.batchNumber}
              </DialogTitle>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-200">{selectedBatch?.product?.name || 'Unknown Product'}</span>
                {selectedBatch?.product?.size && (
                  <span className="text-xs bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-medium">
                    {selectedBatch.product.size} {selectedBatch.product.unit || 'gm'}
                  </span>
                )}
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span>Created {selectedBatch?.startDate && new Date(selectedBatch.startDate).toLocaleDateString()}</span>
              </p>
            </div>
            {!isEditingBatch && selectedBatch && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditingBatch(true)} className="h-9 font-medium border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700">
                  <Edit2 className="w-4 h-4 mr-2" /> {t.edit}
                </Button>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.cannotBeUndone} {selectedBatch.batchNumber}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isSaving} onClick={() => setIsDeleteDialogOpen(false)}>{t.cancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteBatch} disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white">
                        {isSaving ? '...' : t.deleteBatch}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button variant="destructive" size="sm" className="h-9 w-9 p-0" disabled={isSaving} onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {selectedBatch && (
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* General Details Card */}
                <div className="bg-white dark:bg-[#252525] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Core Information</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-800/50">
                      <span className="text-sm font-medium text-gray-500">{t.status}</span>
                      {isEditingBatch ? (
                        <Select value={formData.status} onValueChange={(v) => setFormData({ status: v })}>
                          <SelectTrigger className="w-[140px] h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="quality_check">Quality Check</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={`${statusColors[selectedBatch.status]} text-white border-0 font-medium shadow-none px-2 py-0.5`}>
                          {selectedBatch.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-800/50">
                      <span className="text-sm font-medium text-gray-500">{t.producedBy}</span>
                      {isEditingBatch ? (
                        <Input className="w-[140px] h-8 text-sm text-right" value={formData.producedBy} onChange={e => setFormData({ producedBy: e.target.value })} />
                      ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedBatch.producedBy || '-'}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-800/50">
                      <span className="text-sm font-medium text-gray-500">{t.startDate}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{new Date(selectedBatch.startDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">{t.endDate}</span>
                      {isEditingBatch ? (
                        <Input className="w-[140px] h-8 text-sm" type="date" value={formData.endDate} onChange={e => setFormData({ endDate: e.target.value })} />
                      ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedBatch.endDate ? new Date(selectedBatch.endDate).toLocaleDateString() : '-'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics Card */}
                <div className="bg-white dark:bg-[#252525] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Production Metrics</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-800/50">
                      <span className="text-sm font-medium text-gray-500">{t.targetQty}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedBatch.targetQty} kg</span>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-800/50">
                      <span className="text-sm font-medium text-gray-500">{t.actualQtyKg}</span>
                      {isEditingBatch ? (
                        <Input className="w-[100px] h-8 text-sm text-right" type="number" step="0.1" value={formData.actualQty} onChange={e => setFormData({ actualQty: parseFloat(e.target.value) || 0 })} />
                      ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedBatch.actualQty ?? '-'} kg</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-800/50">
                      <span className="text-sm font-medium text-gray-500">{t.yield}</span>
                      <span className={`text-sm font-bold ${selectedBatch.yieldPercent && selectedBatch.yieldPercent >= 95 ? 'text-green-600' : selectedBatch.yieldPercent && selectedBatch.yieldPercent < 80 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                        {selectedBatch.yieldPercent ? `${selectedBatch.yieldPercent.toFixed(1)}%` : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">{t.qualityScore}</span>
                      {isEditingBatch ? (
                        <Input className="w-[100px] h-8 text-sm text-right" type="number" min="0" max="10" value={formData.qualityScore} onChange={e => setFormData({ qualityScore: parseInt(e.target.value) || 0 })} />
                      ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedBatch.qualityScore ?? '-'} / 10</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes Container */}
                <div className="col-span-1 md:col-span-2 bg-gray-50 dark:bg-[#252525] p-5 rounded-xl border border-gray-100 dark:border-gray-800 text-sm">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{t.notes}</span>
                  {isEditingBatch ? (
                    <Input className="w-full bg-white dark:bg-black/50 border-gray-300" value={formData.notes} onChange={e => setFormData({ notes: e.target.value })} placeholder="Add batch notes..." />
                  ) : selectedBatch.notes ? (
                    <p className="text-gray-600 dark:text-gray-400 italic">"{selectedBatch.notes}"</p>
                  ) : <span className="text-gray-400 dark:text-gray-600 italic">No notes provided for this batch.</span>}
                </div>
              </div>

              {/* Data Tables */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                {selectedBatch.batchItems && selectedBatch.batchItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 ml-1">Materials Breakdown</h4>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 border-b border-gray-100 dark:border-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Material</th>
                            <th className="px-4 py-3 text-right font-semibold">Qty Used</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50 bg-white dark:bg-transparent">
                          {selectedBatch.batchItems.map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3.5 font-medium text-gray-700 dark:text-gray-300">{item.materialName}</td>
                              <td className="px-4 py-3.5 text-right font-medium text-gray-900 dark:text-gray-100">{item.quantityUsed} kg</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedBatch.qualityChecks && selectedBatch.qualityChecks.length > 0 && !isEditingBatch && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 ml-1">Quality Audit Log</h4>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 border-b border-gray-100 dark:border-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Date</th>
                            <th className="px-4 py-3 text-center font-semibold">Score</th>
                            <th className="px-4 py-3 text-right font-semibold">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50 bg-white dark:bg-transparent">
                          {selectedBatch.qualityChecks.map((qc: any) => (
                            <tr key={qc.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{new Date(qc.checkedAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3.5 text-center font-bold text-gray-900 dark:text-gray-100">{qc.overallScore}/10</td>
                              <td className="px-4 py-3.5 text-right">
                                <Badge variant="outline" className={`${qc.passed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} shadow-none font-semibold px-2 py-0.5`}>
                                  {qc.passed ? 'PASSED' : 'FAILED'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {isEditingBatch && (
                <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-100 dark:border-gray-800">
                  <Button type="button" variant="outline" onClick={() => setIsEditingBatch(false)} className="px-6 h-10 font-medium">
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateBatch} disabled={isSaving} className="bg-[#E8A838] hover:bg-[#d49a2d] text-black shadow-sm px-6 h-10 font-medium border-0">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
