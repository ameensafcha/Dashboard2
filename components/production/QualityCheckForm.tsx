'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { createQualityCheck, getProductionBatches } from '@/app/actions/production';

interface BatchOption {
    id: string;
    batchNumber: string;
    status: string;
    product: { name: string };
}

const QC_STEPS = [
    { key: 'visualInspection', label: 'Visual Inspection', description: 'Check color, texture, packaging integrity' },
    { key: 'weightVerification', label: 'Weight Verification', description: 'Verify weight matches target specifications' },
    { key: 'tasteTest', label: 'Taste Test', description: 'Flavor profile, sweetness, aftertaste check' },
    { key: 'labAnalysis', label: 'Lab Analysis', description: 'Microbial, moisture, heavy metals (optional)' },
    { key: 'sfdaCompliance', label: 'SFDA Compliance', description: 'Label accuracy, ingredient list, allergen warnings' },
] as const;

export default function QualityCheckForm({ onSuccess }: { onSuccess: () => void }) {
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [batchId, setBatchId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, string>>({
        visualInspection: '',
        weightVerification: '',
        tasteTest: '',
        labAnalysis: '',
        sfdaCompliance: '',
    });
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [generalNotes, setGeneralNotes] = useState('');

    useEffect(() => {
        (async () => {
            const data = await getProductionBatches();
            // Only show batches that are in quality_check or in_progress status
            const eligible = data.filter((b: any) =>
                b.status === 'quality_check' || b.status === 'in_progress'
            );
            setBatches(eligible as any);
        })();
    }, []);

    const setResult = (key: string, value: string) => {
        setResults(prev => ({ ...prev, [key]: value }));
        setError(null);
    };

    const allRequired = ['visualInspection', 'weightVerification', 'tasteTest', 'sfdaCompliance'];
    const allFilled = allRequired.every(k => results[k] === 'pass' || results[k] === 'fail');
    const passed = allRequired.every(k => results[k] === 'pass');
    const failedCount = allRequired.filter(k => results[k] === 'fail').length;

    const overallScore = allFilled
        ? Math.round(((allRequired.length - failedCount) / allRequired.length) * 10)
        : 0;

    const handleSubmit = async () => {
        if (!batchId) { setError('Select a batch.'); return; }
        if (!allFilled) { setError('Complete all required checks.'); return; }

        setIsSaving(true);
        setError(null);

        const result = await createQualityCheck({
            batchId,
            visualInspection: results.visualInspection,
            visualNotes: notes.visualInspection || undefined,
            weightVerification: results.weightVerification,
            weightNotes: notes.weightVerification || undefined,
            tasteTest: results.tasteTest,
            tasteNotes: notes.tasteTest || undefined,
            labAnalysis: results.labAnalysis || undefined,
            sfdaCompliance: results.sfdaCompliance,
            overallScore,
            passed,
            checkedAt: new Date(),
            notes: generalNotes || undefined,
        });

        setIsSaving(false);
        if (result.success) {
            // Reset form
            setBatchId('');
            setResults({ visualInspection: '', weightVerification: '', tasteTest: '', labAnalysis: '', sfdaCompliance: '' });
            setNotes({});
            setGeneralNotes('');
            onSuccess();
        } else {
            setError(result.error || 'Failed to submit.');
        }
    };

    return (
        <Card className="p-6 bg-[var(--card)] border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Submit Quality Check</h2>

            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md mb-4">{error}</div>}

            {/* Batch Selector */}
            <div className="mb-6">
                <Label>Production Batch <span className="text-red-500">*</span></Label>
                <Select value={batchId} onValueChange={setBatchId}>
                    <SelectTrigger className="mt-1 bg-[var(--background)] border-[var(--border)]">
                        <SelectValue placeholder="Select batch to inspect..." />
                    </SelectTrigger>
                    <SelectContent className="z-[105]">
                        {batches.length === 0 ? (
                            <SelectItem value="__none" disabled>No eligible batches</SelectItem>
                        ) : (
                            batches.map(b => (
                                <SelectItem key={b.id} value={b.id}>
                                    {b.batchNumber} — {b.product?.name || 'Unknown'} ({b.status.replace('_', ' ')})
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* 5-Step Checklist */}
            <div className="space-y-4 mb-6">
                {QC_STEPS.map((step, idx) => {
                    const isOptional = step.key === 'labAnalysis';
                    const val = results[step.key];
                    return (
                        <div key={step.key} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <span className="text-[var(--text-primary)] font-medium">
                                        {idx + 1}. {step.label} {isOptional && <span className="text-[var(--text-muted)] text-xs">(optional)</span>}
                                    </span>
                                    <p className="text-[var(--text-muted)] text-xs mt-0.5">{step.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setResult(step.key, 'pass')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${val === 'pass' ? 'bg-green-500 text-white' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-green-500/10'}`}
                                    >
                                        ✓ Pass
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setResult(step.key, 'fail')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${val === 'fail' ? 'bg-red-500 text-white' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-red-500/10'}`}
                                    >
                                        ✗ Fail
                                    </button>
                                </div>
                            </div>
                            {val && (
                                <Textarea
                                    placeholder={`Notes for ${step.label}...`}
                                    value={notes[step.key] || ''}
                                    onChange={(e) => setNotes(prev => ({ ...prev, [step.key]: e.target.value }))}
                                    className="mt-2 bg-[var(--card)] border-[var(--border)] min-h-[40px] text-sm"
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            {allFilled && (
                <div className={`p-4 rounded-lg border mb-4 ${passed ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge className={passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                                {passed ? 'PASSED' : 'FAILED'}
                            </Badge>
                            <span className="text-[var(--text-primary)] font-semibold">Score: {overallScore}/10</span>
                        </div>
                        {passed && <span className="text-green-600 text-xs">✓ Batch will be marked Completed. Inventory will auto-update.</span>}
                        {!passed && <span className="text-red-500 text-xs">✗ Batch will be marked Failed. No inventory change.</span>}
                    </div>
                </div>
            )}

            <div className="mb-4">
                <Label>General Notes</Label>
                <Textarea
                    placeholder="Overall observations..."
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    className="mt-1 bg-[var(--background)] border-[var(--border)] min-h-[60px]"
                />
            </div>

            <Button
                className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 w-full"
                onClick={handleSubmit}
                disabled={isSaving || !batchId || !allFilled}
            >
                {isSaving ? 'Submitting...' : `Submit QC — ${passed ? 'Complete Batch' : 'Reject Batch'}`}
            </Button>
        </Card>
    );
}
