'use client';

import { useEffect, useState } from 'react';
import { getProducts, ProductsResponse } from '@/app/actions/product/actions';
import { getProductionBatches, createProductionBatch, ProductionBatchWithProduct } from '@/app/actions/production';
import { getRawMaterials } from '@/app/actions/inventory/raw-materials';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useProductionStore } from '@/stores/productionStore';
import { useTranslation } from '@/lib/i18n';
import { Trash2, Edit2, Save, Plus, X, AlertTriangle, Calendar, Users, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const { t, isRTL } = useTranslation();
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
        status: formData.status,
        startDate: new Date(formData.startDate),
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
      producedBy: batch.producedBy || '',
      notes: batch.notes || '',
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
        producedBy: formData.producedBy || undefined,
        notes: formData.notes || undefined,
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
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title={t.productionBatches} />
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#E8A838] hover:bg-[#d49a2d] text-black shadow-lg shadow-[#E8A838]/20 transition-all active:scale-95 font-bold gap-2 px-6"
        >
          <Plus className="w-4 h-4" />
          {t.addBatch}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] shadow-sm" style={{ background: 'var(--card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.batchNo}</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.product}</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hidden md:table-cell">{t.targetQty}</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hidden lg:table-cell">{t.actualQty}</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hidden lg:table-cell">{t.yield}</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.status}</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hidden sm:table-cell">{t.startDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[var(--text-secondary)] italic">
                    {t.noActiveProduction}
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="group cursor-pointer hover:bg-[var(--muted)]/30 transition-colors"
                    onClick={() => handleRowClick(batch)}
                  >
                    <td className="px-6 py-4 font-mono text-sm text-[var(--text-primary)] font-bold">{batch.batchNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{batch.product?.name || '-'}</span>
                        {batch.product?.size && (
                          <span className="text-[10px] mt-1 text-[var(--text-secondary)] uppercase tracking-tight">
                            {batch.product.size} {batch.product.unit || 'gm'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-[var(--text-primary)] font-medium">{batch.targetQty}</td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-[var(--text-primary)] font-medium">{batch.actualQty ?? '-'}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-bold",
                          batch.yieldPercent && batch.yieldPercent >= 95 ? "text-green-500" :
                            batch.yieldPercent && batch.yieldPercent < 80 ? "text-red-500" : "text-[var(--text-primary)]"
                        )}>
                          {batch.yieldPercent ? `${batch.yieldPercent.toFixed(1)}%` :
                            (batch.actualQty && batch.targetQty) ? `${((Number(batch.actualQty) / Number(batch.targetQty)) * 100).toFixed(1)}%` : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border-0 shadow-sm",
                        statusColors[batch.status]
                      )}>
                        {batch.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-sm text-[var(--text-secondary)]">
                      {new Date(batch.startDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Batch Modal - Refined for premium UI */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) { resetForm(); setMaterialRows([]); } }}>
        <DialogContent className="sm:max-w-xl border-[var(--border)] shadow-2xl p-0 overflow-hidden" style={{ background: 'var(--card)' }}>
          <div className={cn("bg-[var(--muted)]/50 p-6 border-b border-[var(--border)]", isRTL ? "text-right" : "")}>
            <DialogHeader className={isRTL ? "items-end" : ""}>
              <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">{t.createNewBatch}</DialogTitle>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{t.productAndTarget}</p>
            </DialogHeader>
          </div>

          <div className="p-6 grid gap-6 overflow-y-auto max-h-[65vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className={cn("text-xs font-bold uppercase text-[var(--text-secondary)] block", isRTL ? "text-right" : "")}>{t.product} <span className="text-red-500">*</span></Label>
                <Select value={formData.productId} onValueChange={(v) => setFormData({ productId: v })}>
                  <SelectTrigger className={cn("bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-[#E8A838] h-11", isRTL ? "flex-row-reverse" : "")}>
                    <SelectValue placeholder={t.selectProductPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id} className={isRTL ? "text-right" : ""}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={cn("text-xs font-bold uppercase text-[var(--text-secondary)] block", isRTL ? "text-right" : "")}>{t.status}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ status: v })}>
                  <SelectTrigger className={cn("bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-[#E8A838] h-11", isRTL ? "flex-row-reverse" : "")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
                    <SelectItem value="planned" className={isRTL ? "text-right" : ""}>{t.planned}</SelectItem>
                    <SelectItem value="in_progress" className={isRTL ? "text-right" : ""}>{t.inProgress}</SelectItem>
                    <SelectItem value="quality_check" className={isRTL ? "text-right" : ""}>{t.qualityCheck}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className={cn("text-xs font-bold uppercase text-[var(--text-secondary)] block", isRTL ? "text-right" : "")}>{t.targetQtyKg} <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.targetQty || ''}
                  onChange={(e) => setFormData({ targetQty: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step={0.1}
                  placeholder={t.plannedProduction}
                  className={cn(
                    "bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] h-11 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    isRTL ? "text-right [direction:rtl]" : "text-left [direction:ltr]"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className={cn("text-xs font-bold uppercase text-[var(--text-secondary)] block", isRTL ? "text-right" : "")}>{t.startDate}</Label>
                <div className="relative">
                  <Calendar className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]", isRTL ? "right-3" : "left-3")} />
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ startDate: e.target.value })}
                    className={cn(
                      "bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] h-11",
                      isRTL ? "pr-10 text-right" : "pl-10"
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className={cn("text-xs font-bold uppercase text-[var(--text-secondary)] block", isRTL ? "text-right" : "")}>{t.producedBy}</Label>
                <div className="relative">
                  <Users className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]", isRTL ? "right-3" : "left-3")} />
                  <Input
                    value={formData.producedBy}
                    onChange={(e) => setFormData({ producedBy: e.target.value })}
                    placeholder={t.productionManager}
                    className={cn(
                      "bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] h-11",
                      isRTL ? "pr-10 text-right" : "pl-10"
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className={cn("text-xs font-bold uppercase text-[var(--text-secondary)] block", isRTL ? "text-right" : "")}>{t.notes}</Label>
              <div className="relative">
                <FileText className={cn("absolute top-3 w-4 h-4 text-[var(--text-secondary)]", isRTL ? "right-3" : "left-3")} />
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ notes: e.target.value })}
                  placeholder={t.productionNotes}
                  className={cn(
                    "bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] h-11",
                    isRTL ? "pr-10 text-right" : "pl-10"
                  )}
                />
              </div>
            </div>

            {/* Raw Materials Used - Professional Table Style */}
            <div className="space-y-4 border-t border-[var(--border)] pt-6 mt-2">
              <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "")}>
                <div className={isRTL ? "text-right" : ""}>
                  <Label className="text-sm font-bold text-[var(--text-primary)]">{t.materialsBreakdown}</Label>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">{t.trackConsumption}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setMaterialRows(prev => [...prev, { rawMaterialId: '', materialName: '', quantityUsed: 0 }])} className="border-[var(--border)] hover:bg-[#E8A838]/10 hover:text-[#E8A838] h-8 font-bold">
                  <Plus className={cn("w-3 h-3", isRTL ? "ml-1" : "mr-1")} /> {t.addMaterial}
                </Button>
              </div>

              {materialRows.length === 0 && (
                <div className="bg-[var(--muted)]/30 rounded-xl p-8 border-2 border-dashed border-[var(--border)] text-center text-[var(--text-secondary)] text-sm italic">
                  {t.noMaterialsFound}
                </div>
              )}

              <div className="space-y-3">
                {materialRows.map((row, idx) => {
                  const selectedMat = rawMaterials.find(m => m.id === row.rawMaterialId);
                  const isInsufficient = selectedMat && row.quantityUsed > selectedMat.currentStock;
                  const isDuplicate = materialRows.some((r, i) => r.rawMaterialId === row.rawMaterialId && i !== idx && row.rawMaterialId !== '');

                  return (
                    <div key={idx} className="space-y-1">
                      <div className={cn("flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200", isRTL ? "flex-row-reverse" : "")}>
                        <div className="flex-1">
                          <Select value={row.rawMaterialId} onValueChange={(v) => {
                            const mat = rawMaterials.find(m => m.id === v);
                            setMaterialRows(prev => prev.map((r, i) => i === idx ? { ...r, rawMaterialId: v, materialName: mat?.name || '' } : r));
                          }}>
                            <SelectTrigger className={cn("bg-[var(--muted)] border-[var(--border)] h-11", isRTL ? "flex-row-reverse" : "")}>
                              <SelectValue placeholder={t.selectMaterialPlaceholder} />
                            </SelectTrigger>
                            <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
                              {rawMaterials
                                .filter(m => m.id === row.rawMaterialId || !materialRows.some(r => r.rawMaterialId === m.id))
                                .map(m => (
                                  <SelectItem 
                                    key={m.id} 
                                    value={m.id} 
                                    className={isRTL ? "text-right" : "text-left"}
                                  >
                                    {m.name} ({Math.max(0, Number(m.currentStock))} kg)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-28">
                          <Input
                            type="number"
                            placeholder="Qty (kg)"
                            className={cn(
                              "bg-[var(--muted)] border-[var(--border)] h-11 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                              isRTL ? "text-right [direction:rtl]" : "text-left [direction:ltr]"
                            )}
                            value={row.quantityUsed || ''}
                            min={0}
                            step={0.1}
                            onChange={(e) => setMaterialRows(prev => prev.map((r, i) => i === idx ? { ...r, quantityUsed: parseFloat(e.target.value) || 0 } : r))}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setMaterialRows(prev => prev.filter((_, i) => i !== idx))}
                          className="h-11 w-11 p-0 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                        >
                          <Plus className="rotate-45 h-5 w-5" />
                        </Button>
                      </div>
                      {isInsufficient && (
                        <p className={cn("text-[10px] text-red-500 font-bold uppercase px-1", isRTL ? "text-right" : "")}>{t.needRawMaterials}</p>
                      )}
                      {isDuplicate && (
                        <p className={cn("text-[10px] text-amber-500 font-bold uppercase px-1", isRTL ? "text-right" : "")}>{t.duplicateMaterial}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className={cn("p-6 pt-2 border-t border-[var(--border)] gap-2", isRTL ? "flex-row-reverse" : "")}>
            <Button variant="ghost" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 text-[var(--text-secondary)] hover:bg-[var(--muted)] h-11 font-medium">
              {t.cancel}
            </Button>
            {materialRows.length > 0 && (
              <Button
                onClick={handleSubmit}
                disabled={isSaving || materialRows.some(r => !r.rawMaterialId || r.quantityUsed <= 0) || materialRows.some((r, idx) => {
                  const mat = rawMaterials.find(m => m.id === r.rawMaterialId);
                  return (mat && r.quantityUsed > mat.currentStock) || materialRows.some((row, i) => row.rawMaterialId === r.rawMaterialId && i !== idx);
                })}
                className="flex-[2] bg-[#E8A838] hover:bg-[#d49a2d] text-black font-bold h-11 shadow-lg shadow-[#E8A838]/20 transition-all active:scale-95 gap-2"
              >
                {isSaving ? '...' : t.createBatch}
                <ChevronRight className={cn("w-4 h-4", isRTL ? "rotate-180" : "")} />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => {
        setIsDetailOpen(open);
        if (!open) setIsEditingBatch(false);
      }}>
        <DialogContent className="sm:max-w-4xl p-0 border-[var(--border)] overflow-hidden shadow-2xl rounded-2xl bg-[var(--card)]">
          {/* Header Region */}
          <div className={cn(
            "flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--muted)]/30",
            isRTL ? "flex-row-reverse" : ""
          )}>
            <div className={isRTL ? "text-right" : ""}>
              <DialogTitle className={cn(
                "text-xl font-black flex items-center gap-3 text-[var(--text-primary)] mb-1",
                isRTL ? "flex-row-reverse" : ""
              )}>
                {t.batchDetails} <span className="text-[var(--border)]">|</span> <span className="text-[#E8A838]">{selectedBatch?.batchNumber}</span>
              </DialogTitle>
              <p className={cn(
                "text-sm text-[var(--text-secondary)] flex items-center gap-2",
                isRTL ? "flex-row-reverse" : ""
              )}>
                <span className="font-bold text-[var(--text-primary)]">{selectedBatch?.product?.name || 'Unknown Product'}</span>
                {selectedBatch?.product?.size && (
                  <span className="text-[10px] bg-[#E8A838]/10 px-1.5 py-0.5 rounded text-[#E8A838] font-black uppercase tracking-wider">
                    {selectedBatch.product.size} {selectedBatch.product.unit || 'gm'}
                  </span>
                )}
                <span className="text-[var(--border)]">•</span>
                <span>{t.created} {selectedBatch?.startDate && new Date(selectedBatch.startDate).toLocaleDateString()}</span>
              </p>
            </div>
            {!isEditingBatch && selectedBatch && (
              <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBatch(true)}
                  className="h-9 font-bold border-[var(--border)] shadow-sm hover:bg-[#E8A838]/10 hover:text-[#E8A838] text-[var(--text-primary)] transition-all"
                >
                  <Edit2 className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.edit}
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

                <Button variant="destructive" size="sm" className="h-9 w-9 p-0 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border-0 transition-all" disabled={isSaving} onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {selectedBatch && (
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* General Details Card */}
                <div className="bg-[var(--muted)]/20 p-6 rounded-2xl border border-[var(--border)] shadow-sm group hover:border-[#E8A838]/30 transition-all">
                  <h3 className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6 flex items-center gap-2",
                    isRTL ? "flex-row-reverse text-right" : ""
                  )}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E8A838]" />
                    {t.coreInformation}
                  </h3>

                  <div className="space-y-5">
                    <div className={cn("flex items-center justify-between pb-3 border-b border-[var(--border)]/50", isRTL ? "flex-row-reverse" : "")}>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.status}</span>
                      {isEditingBatch ? (
                        <Select value={formData.status} onValueChange={(v) => setFormData({ status: v })}>
                          <SelectTrigger className="w-[140px] h-9 text-xs bg-[var(--muted)] border-[var(--border)]"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                            <SelectItem value="planned">{t.planned}</SelectItem>
                            <SelectItem value="in_progress">{t.inProgress}</SelectItem>
                            <SelectItem value="quality_check">{t.qualityCheck}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={cn(
                          "text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-0 shadow-lg",
                          statusColors[selectedBatch.status]
                        )}>
                          {selectedBatch.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    <div className={cn("flex items-center justify-between pb-3 border-b border-[var(--border)]/50", isRTL ? "flex-row-reverse" : "")}>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.producedBy}</span>
                      {isEditingBatch ? (
                        <Input className={cn("w-[140px] h-9 text-xs bg-[var(--muted)] border-[var(--border)]", isRTL ? "text-right" : "")} value={formData.producedBy} onChange={e => setFormData({ producedBy: e.target.value })} />
                      ) : (
                        <span className="text-sm font-black text-[var(--text-primary)]">{selectedBatch.producedBy || '-'}</span>
                      )}
                    </div>

                    <div className={cn("flex items-center justify-between pb-3 border-b border-[var(--border)]/50", isRTL ? "flex-row-reverse" : "")}>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.startDate}</span>
                      <span className="text-sm font-black text-[var(--text-primary)]">{new Date(selectedBatch.startDate).toLocaleDateString()}</span>
                    </div>

                    <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "")}>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.endDate}</span>
                      <span className="text-sm font-black text-[var(--text-primary)]">{selectedBatch.endDate ? new Date(selectedBatch.endDate).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Card */}
                <div className="bg-[var(--muted)]/20 p-6 rounded-2xl border border-[var(--border)] shadow-sm group hover:border-[#E8A838]/30 transition-all">
                  <h3 className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6 flex items-center gap-2",
                    isRTL ? "flex-row-reverse text-right" : ""
                  )}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E8A838]" />
                    {t.productionMetrics}
                  </h3>

                  <div className="space-y-5">
                    <div className={cn("flex items-center justify-between pb-3 border-b border-[var(--border)]/50", isRTL ? "flex-row-reverse" : "")}>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.targetQty}</span>
                      <span className="text-sm font-black text-[#E8A838]">{selectedBatch.targetQty} kg</span>
                    </div>

                    <div className={cn("flex items-center justify-between pb-3 border-b border-[var(--border)]/50", isRTL ? "flex-row-reverse" : "")}>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.actualQtyKg}</span>
                      <span className="text-sm font-black text-[var(--text-primary)]">{selectedBatch.actualQty ?? '-'} kg</span>
                    </div>

                    <div className={cn("flex items-center justify-between pb-3 border-b border-[var(--border)]/50", isRTL ? "flex-row-reverse" : "")}>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.yield}</span>
                      <span className={cn(
                        "text-sm font-black transition-all",
                        selectedBatch.yieldPercent && selectedBatch.yieldPercent >= 95 ? 'text-green-500' :
                          selectedBatch.yieldPercent && selectedBatch.yieldPercent < 80 ? 'text-red-500' : 'text-[var(--text-primary)]'
                      )}>
                        {selectedBatch.yieldPercent ? `${selectedBatch.yieldPercent.toFixed(1)}%` : '-'}
                      </span>
                    </div>

                    <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "")}>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.qualityScore}</span>
                      <div className={cn("flex items-center gap-1.5", isRTL ? "flex-row-reverse" : "")}>
                        <span className="text-lg font-black text-[#E8A838] leading-none">{selectedBatch.qualityScore ?? '-'}</span>
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">/ 10</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Container */}
                <div className={cn(
                  "col-span-1 md:col-span-2 bg-[var(--muted)]/10 p-6 rounded-2xl border border-[var(--border)]",
                  isRTL ? "text-right" : ""
                )}>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-4 flex items-center gap-2",
                    isRTL ? "flex-row-reverse" : ""
                  )}>
                    <FileText className="w-3 h-3 text-[#E8A838]" />
                    {t.notes}
                  </span>
                  {isEditingBatch ? (
                    <Input className={cn("w-full bg-[var(--muted)] border-[var(--border)] h-12 text-sm", isRTL ? "text-right" : "")} value={formData.notes} onChange={e => setFormData({ notes: e.target.value })} placeholder={t.productionNotes} />
                  ) : selectedBatch.notes ? (
                    <p className="text-sm font-medium text-[var(--text-primary)] italic leading-relaxed">"{selectedBatch.notes}"</p>
                  ) : (
                    <span className="text-xs font-medium text-[var(--text-secondary)] italic">{t.noNotesProvided}</span>
                  )}
                </div>
              </div>

              {/* Data Tables */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedBatch.batchItems && selectedBatch.batchItems.length > 0 && (
                  <div>
                    <h4 className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-4 ml-1 flex items-center gap-2",
                      isRTL ? "flex-row-reverse text-right" : ""
                    )}>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E8A838]" />
                      {t.materialsBreakdown}
                    </h4>
                    <div className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm bg-[var(--muted)]/20">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-[var(--muted)]/50 text-[var(--text-secondary)] border-b border-[var(--border)]">
                          <tr>
                            <th className={cn("px-5 py-4 text-xs font-bold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>{t.materialName}</th>
                            <th className={cn("px-5 py-4 text-xs font-bold uppercase tracking-wider font-mono w-24", isRTL ? "text-left" : "text-right")}>{t.qty}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]/50">
                          {selectedBatch.batchItems.map((item) => (
                            <tr key={item.id} className="hover:bg-[var(--muted)]/30 transition-colors group/row">
                              <td className={cn("px-5 py-4 font-bold text-[var(--text-primary)]", isRTL ? "text-right" : "text-left")}>{item.materialName}</td>
                              <td className={cn("px-5 py-4 font-black font-mono text-[#E8A838]", isRTL ? "text-left" : "text-right")}>{item.quantityUsed} kg</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedBatch.qualityChecks && selectedBatch.qualityChecks.length > 0 && !isEditingBatch && (
                  <div>
                    <h4 className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-4 ml-1 flex items-center gap-2",
                      isRTL ? "flex-row-reverse text-right" : ""
                    )}>
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      {t.qualityAuditLog}
                    </h4>
                    <div className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm bg-[var(--muted)]/20">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-[var(--muted)]/50 text-[var(--text-secondary)] border-b border-[var(--border)]">
                          <tr>
                            <th className={cn("px-5 py-4 text-xs font-bold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>{t.startDate}</th>
                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider">{t.score}</th>
                            <th className={cn("px-5 py-4 text-xs font-bold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>{t.result}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]/50">
                          {selectedBatch.qualityChecks.map((qc) => (
                            <tr key={qc.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                              <td className={cn("px-5 py-4 font-medium text-[var(--text-secondary)]", isRTL ? "text-right" : "text-left")}>{new Date(qc.checkedAt).toLocaleDateString()}</td>
                              <td className="px-5 py-4 text-center font-black text-xl text-[#E8A838]">{qc.overallScore}</td>
                              <td className={cn("px-5 py-4", isRTL ? "text-left" : "text-right")}>
                                <Badge className={cn(
                                  "shadow-lg font-black px-3 py-1 rounded-full border-0 text-[10px] uppercase tracking-widest text-white",
                                  qc.passed ? 'bg-green-500' : 'bg-red-500'
                                )}>
                                  {qc.passed ? t.passed : t.failedResult}
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
                <div className={cn(
                  "flex items-center justify-end gap-3 mt-10 pt-6 border-t border-[var(--border)] animate-in fade-in slide-in-from-bottom-2",
                  isRTL ? "flex-row-reverse" : ""
                )}>
                  <Button type="button" variant="ghost" onClick={() => setIsEditingBatch(false)} className="px-8 h-11 font-black uppercase tracking-widest text-[var(--text-secondary)] hover:bg-[var(--muted)] transition-all">
                    {t.cancel}
                  </Button>
                  <Button
                    onClick={handleUpdateBatch}
                    disabled={isSaving}
                    className="bg-[#E8A838] hover:bg-[#d49a2d] text-black shadow-xl shadow-[#E8A838]/20 px-8 h-11 font-black uppercase tracking-widest border-0 gap-3 transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? '...' : t.saveChanges}
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
