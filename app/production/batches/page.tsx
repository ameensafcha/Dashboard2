'use client';

import { useEffect } from 'react';
import { getProducts, ProductsResponse } from '@/app/actions/product/actions';
import { getProductionBatches, createProductionBatch, ProductionBatchWithProduct } from '@/app/actions/production';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useProductionStore } from '@/stores/productionStore';

const statusColors: Record<string, string> = {
  planned: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  quality_check: 'bg-purple-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

export default function ProductionBatchesPage() {
  const {
    batches,
    products,
    isModalOpen,
    selectedBatch,
    isDetailOpen,
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
  } = useProductionStore();

  const loadData = async () => {
    const [batchesData, productsData] = await Promise.all([
      getProductionBatches(),
      getProducts({ page: 1, limit: 100, search: '', status: '' }) as Promise<ProductsResponse>,
    ]);
    setBatches(batchesData);
    setProducts(productsData.products || []);
  };

  useEffect(() => {
    loadData();
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
      });

      if (result.success) {
        toast({ title: 'Success', description: 'Batch created successfully' });
        setIsModalOpen(false);
        resetForm();
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
    setIsDetailOpen(true);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader title="Production Batches" />
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#E8A838] hover:bg-[#d49a2d] text-black">
          <Plus className="w-4 h-4 mr-2" />
          New Batch
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <table className="w-full min-w-[800px]">
            <thead style={{ background: 'var(--muted)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Batch #</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold hidden md:table-cell">Target (kg)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold hidden lg:table-cell">Actual (kg)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold hidden lg:table-cell">Yield %</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold hidden sm:table-cell">Start Date</th>
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
                    <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{batch.product?.name || '-'}</td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--foreground)' }}>{batch.targetQty}</td>
                    <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--foreground)' }}>{batch.actualQty ?? '-'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--foreground)' }}>{batch.yieldPercent ? `${batch.yieldPercent.toFixed(1)}%` : '-'}</td>
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
            <DialogTitle>Create New Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            
            <div>
              <Label>Product *</Label>
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
              <Label>Status</Label>
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
              <Label>Target Quantity (kg) *</Label>
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
              <Label>Actual Quantity (kg)</Label>
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
              <Label>Quality Score (1-10)</Label>
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
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ startDate: e.target.value })}
              />
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ endDate: e.target.value })}
              />
            </div>

            <div>
              <Label>Produced By</Label>
              <Input
                value={formData.producedBy}
                onChange={(e) => setFormData({ producedBy: e.target.value })}
                placeholder="Production manager name"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ notes: e.target.value })}
                placeholder="Production notes, issues encountered"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSaving} className="bg-[#E8A838] hover:bg-[#d49a2d] text-black">
                {isSaving ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Details - {selectedBatch?.batchNumber}</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Status</p>
                  <Badge className={`${statusColors[selectedBatch.status]} text-white mt-1`}>
                    {selectedBatch.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Product</p>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>{selectedBatch.product?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Target Quantity</p>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>{selectedBatch.targetQty} kg</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Actual Quantity</p>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>{selectedBatch.actualQty ?? '-'} kg</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Yield</p>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {selectedBatch.yieldPercent ? `${selectedBatch.yieldPercent.toFixed(1)}%` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Quality Score</p>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>{selectedBatch.qualityScore ?? '-'} / 10</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Start Date</p>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>{new Date(selectedBatch.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>End Date</p>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {selectedBatch.endDate ? new Date(selectedBatch.endDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Produced By</p>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>{selectedBatch.producedBy || '-'}</p>
                </div>
                {selectedBatch.notes && (
                  <div className="col-span-2">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Notes</p>
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>{selectedBatch.notes}</p>
                  </div>
                )}
              </div>

              {selectedBatch.batchItems && selectedBatch.batchItems.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Raw Materials Used</p>
                  <div className="rounded border" style={{ borderColor: 'var(--border)' }}>
                    <table className="w-full">
                      <thead style={{ background: 'var(--muted)' }}>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold">Material</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold">Quantity (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBatch.batchItems.map((item: any) => (
                          <tr key={item.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                            <td className="px-3 py-2 text-sm">{item.materialName}</td>
                            <td className="px-3 py-2 text-sm text-right">{item.quantityUsed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedBatch.qualityChecks && selectedBatch.qualityChecks.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Quality Checks</p>
                  <div className="rounded border" style={{ borderColor: 'var(--border)' }}>
                    <table className="w-full">
                      <thead style={{ background: 'var(--muted)' }}>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold">Score</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBatch.qualityChecks.map((qc: any) => (
                          <tr key={qc.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                            <td className="px-3 py-2 text-sm">{new Date(qc.checkedAt).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-sm text-right">{qc.overallScore}/10</td>
                            <td className="px-3 py-2 text-sm">
                              <Badge className={qc.passed ? 'bg-green-500' : 'bg-red-500'}>
                                {qc.passed ? 'Passed' : 'Failed'}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
