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
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BatchOption {
    id: string;
    batchNumber: string;
    status: string;
    product: { name: string };
}

const QC_STEPS = [
    { key: 'visualInspection', label: 'visual', description: 'visualInspectionDesc' },
    { key: 'weightVerification', label: 'weight', description: 'weightVerificationDesc' },
    { key: 'tasteTest', label: 'taste', description: 'tasteTestDesc' },
    { key: 'labAnalysis', label: 'labAnalysis', description: 'labAnalysisDesc' },
    { key: 'sfdaCompliance', label: 'sfda', description: 'sfdaComplianceDesc' },
] as const;

export default function QualityCheckForm({ onSuccess }: { onSuccess: () => void }) {
    const { t, isRTL } = useTranslation();
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
    const [actualQty, setActualQty] = useState<number | ''>('');

    useEffect(() => {
        (async () => {
            const data = await getProductionBatches();
            // Only show batches that are in quality_check or in_progress status
            const eligible = data.filter((b) =>
                b.status === 'quality_check' || b.status === 'in_progress'
            );
            setBatches(eligible as BatchOption[]);
        })();
    }, []);

    const setResult = (key: string, value: string) => {
        setResults(prev => ({ ...prev, [key]: value }));
        setError(null);
    };

    const allRequired = ['visualInspection', 'weightVerification', 'tasteTest', 'labAnalysis', 'sfdaCompliance'];
    const allFilled = allRequired.every(k => results[k] === 'pass' || results[k] === 'fail');
    const passed = allRequired.every(k => results[k] === 'pass');
    const failedCount = allRequired.filter(k => results[k] === 'fail').length;

    const overallScore = allFilled
        ? Math.round(((allRequired.length - failedCount) / allRequired.length) * 10)
        : 0;

    const handleSubmit = async () => {
        if (!batchId) { setError(t.selectBatchToInspect); return; }
        if (actualQty === '' || actualQty <= 0) { setError(t.enterActualQty); return; }
        if (!allFilled) { setError(t.error); return; }

        setIsSaving(true);
        setError(null);

        const result = await createQualityCheck({
            batchId,
            actualQty: Number(actualQty),
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
            setActualQty('');
            setGeneralNotes('');
            onSuccess();
        } else {
            setError(result.error || t.error);
        }
    };

    return (
        <Card className="p-8 bg-[var(--card)] border-[var(--border)] shadow-xl overflow-hidden rounded-2xl relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8A838]/5 rounded-bl-[100px] -mr-10 -mt-10" />

            <div className={cn("flex items-center gap-3 mb-8 relative", isRTL ? "flex-row-reverse" : "")}>
                <div className="w-10 h-10 rounded-xl bg-[#E8A838]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#E8A838]" />
                </div>
                <div>
                    <h2 className={cn("text-xl font-black text-[var(--text-primary)]", isRTL ? "text-right" : "")}>{t.submitQualityCheck}</h2>
                    <p className={cn("text-xs text-[var(--text-secondary)] font-medium", isRTL ? "text-right" : "")}>{t.trackConsumption}</p>
                </div>
            </div>

            {error && (
                <div className={cn(
                    "bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold p-3 rounded-xl mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-1",
                    isRTL ? "flex-row-reverse" : ""
                )}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Batch Selector */}
            <div className="mb-8 group">
                <Label className={cn("text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block px-1", isRTL ? "text-right" : "")}>
                    {t.productionBatch} <span className="text-red-500">*</span>
                </Label>
                <Select value={batchId} onValueChange={setBatchId}>
                    <SelectTrigger className={cn(
                        "h-12 bg-[var(--muted)]/30 border-[var(--border)] rounded-xl focus:ring-[#E8A838] transition-all hover:bg-[var(--muted)]/50 text-sm font-bold",
                        isRTL ? "flex-row-reverse" : ""
                    )}>
                        <SelectValue placeholder={batches.length === 0 ? t.noBatchesToInspect : t.selectBatchToInspect} />
                    </SelectTrigger>
                    <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
                        {batches.length === 0 ? (
                            <SelectItem value="__none" disabled className="text-xs">{t.noEligibleBatches}</SelectItem>
                        ) : (
                            batches.map(b => (
                                <SelectItem key={b.id} value={b.id} className="text-xs py-3">
                                    <div className={cn("flex items-center justify-between w-full min-w-[300px]", isRTL ? "flex-row-reverse" : "")}>
                                        <span className="font-black text-[#E8A838]">{b.batchNumber}</span>
                                        <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                            <span className="font-bold text-[var(--text-primary)] opacity-60">•</span>
                                            <span className="max-w-[120px] truncate text-[var(--text-secondary)]">{b.product?.name || 'Unknown'}</span>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Actual Quantity Field - Mandatory here */}
            {batchId && batchId !== '__none' && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className={cn("text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block px-1", isRTL ? "text-right" : "")}>
                        {t.actualQtyKg} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-bold text-xs">
                            KG
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder={t.actualOutput}
                            value={actualQty}
                            onChange={(e) => setActualQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className={cn(
                                "w-full h-12 bg-[var(--muted)]/30 border-[var(--border)] rounded-xl focus:ring-1 focus:ring-[#E8A838] transition-all hover:bg-[var(--muted)]/50 text-sm font-black pl-12 pr-4 outline-none",
                                isRTL ? "text-right" : ""
                            )}
                        />
                    </div>
                    <p className={cn("text-[9px] text-[var(--text-secondary)] mt-2 font-bold uppercase tracking-tight px-1", isRTL ? "text-right" : "")}>
                        {t.enterActualQtyHelp || "Enter the total weight produced after processing."}
                    </p>
                </div>
            )}

            {/* Conditional Content: Only show when a batch is selected */}
            {batchId && batchId !== '__none' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* 5-Step Checklist */}
                    <div className="space-y-4 mb-8">
                        <div className={cn("flex items-center justify-between mb-2", isRTL ? "flex-row-reverse" : "")}>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#E8A838]" />
                                {t.checklist}
                            </h3>
                        </div>
                        {QC_STEPS.map((step, idx) => {
                            const val = results[step.key];
                            const isFilled = val === 'pass' || val === 'fail';

                            return (
                                <div key={step.key} className={cn(
                                    "p-5 rounded-2xl border transition-all duration-300",
                                    isFilled ? "bg-[var(--muted)]/20 border-[#E8A838]/30 overflow-hidden" : "bg-[var(--muted)]/10 border-[var(--border)] hover:border-[var(--border-hover)]"
                                )}>
                                    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 items-center", isRTL ? "text-right" : "")}>
                                        <div>
                                            <h4 className={cn("text-xs font-black text-[var(--text-primary)] flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                                <span className="text-[#E8A838] font-mono">{idx + 1}.</span>
                                                {t[step.label as keyof typeof t]}
                                            </h4>
                                            <p className="text-[var(--text-secondary)] text-[10px] mt-1 font-medium leading-relaxed">{t[step.description as keyof typeof t]}</p>
                                        </div>
                                        <div className={cn("flex gap-2", isRTL ? "flex-row-reverse" : "justify-end")}>
                                            <button
                                                type="button"
                                                onClick={() => setResult(step.key, 'pass')}
                                                className={cn(
                                                    "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    val === 'pass'
                                                        ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                                                        : "bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-green-500/10 border-transparent hover:border-green-500/30"
                                                )}
                                            >
                                                ✓ {t.passed}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResult(step.key, 'fail')}
                                                className={cn(
                                                    "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    val === 'fail'
                                                        ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                                                        : "bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-red-500/10 border-transparent hover:border-red-500/30"
                                                )}
                                            >
                                                ✗ {t.failedResult}
                                            </button>
                                        </div>
                                    </div>
                                    {val && step.key !== 'labAnalysis' && step.key !== 'sfdaCompliance' && (
                                        <Textarea
                                            placeholder={t.productionNotes}
                                            value={notes[step.key] || ''}
                                            onChange={(e) => setNotes(prev => ({ ...prev, [step.key]: e.target.value }))}
                                            className={cn(
                                                "mt-4 bg-[var(--card)] border-[var(--border)] min-h-[50px] text-xs rounded-xl focus:ring-[#E8A838] placeholder:opacity-30",
                                                isRTL ? "text-right" : ""
                                            )}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    {allFilled && (
                        <div className={cn(
                            "p-6 rounded-2xl border mb-8 animate-in zoom-in-95 duration-300",
                            passed
                                ? "border-green-500/30 bg-green-500/5 shadow-inner"
                                : "border-red-500/30 bg-red-500/5 shadow-inner"
                        )}>
                            <div className={cn("flex flex-col md:flex-row items-center justify-between gap-4", isRTL ? "md:flex-row-reverse" : "")}>
                                <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shadow-lg",
                                        passed ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                    )}>
                                        {overallScore}
                                    </div>
                                    <div className={isRTL ? "text-right" : ""}>
                                        <div className={cn("flex items-center gap-2 mb-1", isRTL ? "flex-row-reverse" : "")}>
                                            <Badge className={cn(
                                                "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border-0",
                                                passed ? "bg-green-500" : "bg-red-500"
                                            )}>
                                                {passed ? t.passed : t.failedResult}
                                            </Badge>
                                            <span className="text-xs font-black text-[var(--text-primary)] lowercase opacity-50">/ 10 {t.score}</span>
                                        </div>
                                        <p className={cn(
                                            "text-[10px] font-bold",
                                            passed ? "text-green-500/80" : "text-red-500/80"
                                        )}>
                                            {passed ? t.batchWillBeCompleted : t.batchWillBeFailed}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mb-8">
                        <Label className={cn("text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block px-1", isRTL ? "text-right" : "")}>
                            {t.generalNotes}
                        </Label>
                        <Textarea
                            placeholder={t.productionNotes}
                            value={generalNotes}
                            onChange={(e) => setGeneralNotes(e.target.value)}
                            className={cn(
                                "mt-1 bg-[var(--muted)]/20 border-[var(--border)] min-h-[80px] rounded-2xl focus:ring-[#E8A838] p-4 text-sm resize-none",
                                isRTL ? "text-right" : ""
                            )}
                        />
                    </div>

                    <Button
                        size="lg"
                        className={cn(
                            "w-full h-14 text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl",
                            passed
                                ? "bg-[#E8A838] hover:bg-[#d49a2d] text-black shadow-[#E8A838]/20"
                                : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                        )}
                        onClick={handleSubmit}
                        disabled={isSaving || !batchId || !allFilled}
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span>...</span>
                            </div>
                        ) : (
                            <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                                <Save className="w-4 h-4" />
                                <span>{t.submitQC}</span>
                            </div>
                        )}
                    </Button>
                </div>
            )}
        </Card>
    );
}
