'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2 } from 'lucide-react';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import QualityCheckForm from '@/components/production/QualityCheckForm';
import { getQualityChecks, updateQualityCheck, deleteQualityCheck } from '@/app/actions/production';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AlertCircle, Search, Filter, ArrowUpDown } from 'lucide-react';

interface CheckItem {
    id: string;
    batchId: string;
    visualInspection: string;
    weightVerification: string;
    tasteTest: string;
    labAnalysis: string | null;
    sfdaCompliance: string;
    overallScore: number;
    passed: boolean;
    checkedAt: Date;
    notes: string | null;
    visualNotes: string | null;
    weightNotes: string | null;
    tasteNotes: string | null;
    batch: { batchNumber: string; product: { name: string } | null };
}

const REQUIRED_KEYS = ['visualInspection', 'weightVerification', 'tasteTest', 'sfdaCompliance'] as const;

export default function QualityPageClient({ initialChecks }: { initialChecks: CheckItem[] }) {
    const { t, isRTL } = useTranslation();
    const [checks, setChecks] = useState(initialChecks);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit state
    const [editCheck, setEditCheck] = useState<CheckItem | null>(null);
    const [editResults, setEditResults] = useState<Record<string, string>>({});
    const [editNotes, setEditNotes] = useState<Record<string, string>>({});
    const [editGeneralNotes, setEditGeneralNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const refresh = async () => {
        const data = await getQualityChecks();
        setChecks(data as CheckItem[]);
    };

    // --- DELETE ---
    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        const result = await deleteQualityCheck(deleteId);
        setIsDeleting(false);
        setDeleteId(null);
        if (result.success) refresh();
    };

    // --- EDIT ---
    const openEdit = (c: CheckItem) => {
        setEditCheck(c);
        setEditResults({
            visualInspection: c.visualInspection,
            weightVerification: c.weightVerification,
            tasteTest: c.tasteTest,
            labAnalysis: c.labAnalysis || '',
            sfdaCompliance: c.sfdaCompliance,
        });
        setEditNotes({
            visualInspection: c.visualNotes || '',
            weightVerification: c.weightNotes || '',
            tasteTest: c.tasteNotes || '',
        });
        setEditGeneralNotes(c.notes || '');
        setEditError(null);
    };

    const editAllFilled = REQUIRED_KEYS.every(k => editResults[k] === 'pass' || editResults[k] === 'fail');
    const editPassed = REQUIRED_KEYS.every(k => editResults[k] === 'pass');
    const editFailedCount = REQUIRED_KEYS.filter(k => editResults[k] === 'fail').length;
    const editScore = editAllFilled ? Math.round(((REQUIRED_KEYS.length - editFailedCount) / REQUIRED_KEYS.length) * 10) : 0;

    const handleSaveEdit = async () => {
        if (!editCheck || !editAllFilled) return;
        setIsSaving(true);
        setEditError(null);

        const result = await updateQualityCheck(editCheck.id, {
            visualInspection: editResults.visualInspection,
            visualNotes: editNotes.visualInspection || undefined,
            weightVerification: editResults.weightVerification,
            weightNotes: editNotes.weightVerification || undefined,
            tasteTest: editResults.tasteTest,
            tasteNotes: editNotes.tasteNotes || undefined,
            labAnalysis: editResults.labAnalysis || undefined,
            sfdaCompliance: editResults.sfdaCompliance,
            overallScore: editScore,
            passed: editPassed,
            notes: editGeneralNotes || undefined,
        });

        setIsSaving(false);
        if (result.success) {
            setEditCheck(null);
            refresh();
        } else {
            setEditError(('error' in result ? result.error : null) || 'Failed to update.');
        }
    };

    const statusBadge = (val: string) => (
        <Badge className={cn(
            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border-0 shadow-sm",
            val === 'pass' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
            {val === 'pass' ? t.passed : t.failedResult}
        </Badge>
    );

    const QC_STEPS = [
        { key: 'visualInspection', label: t.visual },
        { key: 'weightVerification', label: t.weight },
        { key: 'tasteTest', label: t.taste },
        { key: 'labAnalysis', label: t.labAnalysisOpt },
        { key: 'sfdaCompliance', label: t.sfda },
    ];

    return (
        <div className="space-y-6">
            <div className={cn("mb-2", isRTL ? "text-right" : "")}>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {t.qualityControl}
                </h1>
            </div>

            {/* QC Submit Form */}
            <QualityCheckForm onSuccess={refresh} />

            {/* History Table */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className={cn("p-6 border-b border-[var(--border)] flex items-center justify-between", isRTL ? "flex-row-reverse" : "")}>
                    <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                        <div className="w-8 h-8 rounded-lg bg-[#E8A838]/10 flex items-center justify-center">
                            <Filter className="w-4 h-4 text-[#E8A838]" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">{t.qcHistory}</h2>
                    </div>
                </div>

                {checks.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--muted)]/5">
                        <Search className="w-12 h-12 text-[var(--text-secondary)]/20 mx-auto mb-4" />
                        <p className="text-sm font-bold text-[var(--text-secondary)]">{t.noQualityChecks}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-[var(--muted)]/30">
                                <tr>
                                    <th className={cn("px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)]", isRTL ? "text-right" : "text-left")}>
                                        <div className={cn("flex items-center gap-2", isRTL ? "justify-end" : "")}>
                                            {t.productionBatch}
                                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                                        </div>
                                    </th>
                                    <th className={cn("px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)]", isRTL ? "text-right" : "text-left")}>{t.product}</th>
                                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)]">{t.visual}</th>
                                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)]">{t.weight}</th>
                                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)]">{t.taste}</th>
                                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)]">{t.sfda}</th>
                                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)]">{t.score}</th>
                                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)]">{t.result}</th>
                                    <th className={cn("px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)]", isRTL ? "text-right" : "text-left")}>{t.date}</th>
                                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)]">{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {checks.map((c) => (
                                    <tr key={c.id} className="group hover:bg-[var(--muted)]/10 transition-colors">
                                        <td className={cn("px-6 py-4 font-black text-[#E8A838]", isRTL ? "text-right" : "text-left")}>{c.batch?.batchNumber}</td>
                                        <td className={cn("px-6 py-4 font-bold text-[var(--text-primary)]", isRTL ? "text-right" : "text-left")}>{c.batch?.product?.name || '-'}</td>
                                        <td className="px-4 py-4 text-center">{statusBadge(c.visualInspection)}</td>
                                        <td className="px-4 py-4 text-center">{statusBadge(c.weightVerification)}</td>
                                        <td className="px-4 py-4 text-center">{statusBadge(c.tasteTest)}</td>
                                        <td className="px-4 py-4 text-center">{statusBadge(c.sfdaCompliance)}</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="inline-flex items-center gap-1 bg-[#E8A838]/10 px-2 py-1 rounded-lg">
                                                <span className="font-black text-[#E8A838]">{c.overallScore}</span>
                                                <span className="text-[9px] font-bold text-[#E8A838]/60 uppercase">/ 10</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <Badge className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-0 shadow-lg text-white",
                                                c.passed ? 'bg-green-500' : 'bg-red-500'
                                            )}>
                                                {c.passed ? t.passed : t.failedResult}
                                            </Badge>
                                        </td>
                                        <td className={cn("px-6 py-4 text-xs font-bold text-[var(--text-secondary)]", isRTL ? "text-right" : "text-left")}>{new Date(c.checkedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className={cn("flex items-center justify-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="w-8 h-8 rounded-lg bg-[var(--muted)] hover:bg-[#E8A838]/10 text-[var(--text-secondary)] hover:text-[#E8A838] transition-all flex items-center justify-center group/btn"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(c.id)}
                                                    className="w-8 h-8 rounded-lg bg-[var(--muted)] hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-all flex items-center justify-center group/btn"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-[var(--card)] border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden p-0">
                    <div className="p-8">
                        <AlertDialogHeader className={cn(isRTL ? "text-right" : "")}>
                            <AlertDialogTitle className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
                                <Trash2 className="w-6 h-6 text-red-500" />
                                {t.deleteQualityCheckTitle}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed pt-2">
                                {t.deleteQualityCheckDesc}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className={cn("mt-8 gap-3", isRTL ? "flex-row-reverse" : "")}>
                            <AlertDialogCancel className="border-[var(--border)] h-11 px-6 font-black uppercase tracking-widest text-[var(--text-secondary)] hover:bg-[var(--muted)] rounded-xl transition-all">{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20 h-11 px-8 font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                            >
                                {isDeleting ? '...' : t.saveChanges}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!editCheck} onOpenChange={(open) => !open && setEditCheck(null)}>
                <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-lg p-0 rounded-2xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
                    <div className={cn("p-6 border-b border-[var(--border)] bg-[var(--muted)]/30", isRTL ? "text-right" : "")}>
                        <DialogTitle className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
                            <Edit2 className="w-5 h-5 text-[#E8A838]" />
                            {t.editQualityCheck}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">
                            <span className="text-[#E8A838]">{editCheck?.batch?.batchNumber}</span> — {editCheck?.batch?.product?.name}
                        </DialogDescription>
                    </div>

                    <div className="p-8 space-y-6">
                        {editError && (
                            <div className={cn("bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold p-3 rounded-xl flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                                <AlertCircle className="w-4 h-4" />
                                {editError}
                            </div>
                        )}

                        <div className="space-y-4">
                            {QC_STEPS.map((step) => {
                                const val = editResults[step.key] || '';
                                return (
                                    <div key={step.key} className={cn(
                                        "p-4 rounded-2xl border transition-all",
                                        val ? "bg-[var(--muted)]/20 border-[#E8A838]/30" : "bg-[var(--muted)]/10 border-[var(--border)]"
                                    )}>
                                        <div className={cn("flex items-center justify-between mb-3", isRTL ? "flex-row-reverse" : "")}>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                                                {step.label}
                                            </span>
                                            <div className={cn("flex gap-2", isRTL ? "flex-row-reverse" : "")}>
                                                <button type="button" onClick={() => setEditResults(p => ({ ...p, [step.key]: 'pass' }))}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                        val === 'pass' ? 'bg-green-500 text-white shadow-lg' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-green-500/10'
                                                    )}>
                                                    ✓ {t.passed}
                                                </button>
                                                <button type="button" onClick={() => setEditResults(p => ({ ...p, [step.key]: 'fail' }))}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                        val === 'fail' ? 'bg-red-500 text-white shadow-lg' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-red-500/10'
                                                    )}>
                                                    ✗ {t.failedResult}
                                                </button>
                                            </div>
                                        </div>
                                        {val && step.key !== 'labAnalysis' && step.key !== 'sfdaCompliance' && (
                                            <Textarea
                                                placeholder={t.productionNotes}
                                                value={editNotes[step.key] || ''}
                                                onChange={(e) => setEditNotes(p => ({ ...p, [step.key]: e.target.value }))}
                                                className={cn("mt-2 bg-[var(--card)] border-[var(--border)] min-h-[50px] text-xs rounded-xl focus:ring-[#E8A838]", isRTL ? "text-right" : "")}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {editAllFilled && (
                            <div className={cn(
                                "p-5 rounded-2xl border flex items-center justify-between shadow-inner",
                                editPassed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
                            )}>
                                <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                    <Badge className={cn(
                                        "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-0 shadow-lg text-white",
                                        editPassed ? "bg-green-500" : "bg-red-500"
                                    )}>
                                        {editPassed ? t.passed : t.failedResult}
                                    </Badge>
                                    <span className="text-xs font-black text-[var(--text-primary)] uppercase opacity-50">{t.overallScore}: {editScore}/10</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className={cn("text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] px-1", isRTL ? "text-right block" : "")}>{t.generalNotes}</Label>
                            <Textarea
                                value={editGeneralNotes}
                                onChange={(e) => setEditGeneralNotes(e.target.value)}
                                className={cn("bg-[var(--muted)]/20 border-[var(--border)] min-h-[80px] rounded-2xl focus:ring-[#E8A838] p-4 text-sm resize-none", isRTL ? "text-right" : "")}
                            />
                        </div>

                        <div className={cn("flex items-center gap-3 pt-4 border-t border-[var(--border)]", isRTL ? "flex-row-reverse" : "justify-end")}>
                            <Button variant="ghost" onClick={() => setEditCheck(null)} className="h-11 px-8 font-black uppercase tracking-widest text-[var(--text-secondary)] rounded-xl">{t.cancel}</Button>
                            <Button onClick={handleSaveEdit} disabled={isSaving || !editAllFilled}
                                className="bg-[#E8A838] hover:bg-[#d49a2d] text-black shadow-xl shadow-[#E8A838]/20 h-11 px-10 font-black uppercase tracking-widest rounded-xl transition-all active:scale-95">
                                {isSaving ? '...' : t.saveChanges}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
