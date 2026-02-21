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
        setChecks(data as any);
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
            setEditError(result.error || 'Failed to update.');
        }
    };

    const statusBadge = (val: string) => (
        <Badge className={val === 'pass' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
            {val}
        </Badge>
    );

    const QC_STEPS = [
        { key: 'visualInspection', label: 'Visual Inspection' },
        { key: 'weightVerification', label: 'Weight Verification' },
        { key: 'tasteTest', label: 'Taste Test' },
        { key: 'labAnalysis', label: 'Lab Analysis (opt)' },
        { key: 'sfdaCompliance', label: 'SFDA Compliance' },
    ];

    return (
        <div className="space-y-6">
            {/* QC Submit Form */}
            <QualityCheckForm onSuccess={refresh} />

            {/* History Table */}
            <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">QC History</h2>
                {checks.length === 0 ? (
                    <p className="text-center py-8 text-[var(--text-muted)]">No quality checks yet.</p>
                ) : (
                    <div className="rounded-md border border-[var(--border)] overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--background)]">
                                <tr className="border-b border-[var(--border)]">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Batch</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Product</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Visual</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Weight</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Taste</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">SFDA</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Score</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Result</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Date</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {checks.map((c) => (
                                    <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--background)]/50">
                                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{c.batch?.batchNumber}</td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{c.batch?.product?.name || '-'}</td>
                                        <td className="px-4 py-3">{statusBadge(c.visualInspection)}</td>
                                        <td className="px-4 py-3">{statusBadge(c.weightVerification)}</td>
                                        <td className="px-4 py-3">{statusBadge(c.tasteTest)}</td>
                                        <td className="px-4 py-3">{statusBadge(c.sfdaCompliance)}</td>
                                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{c.overallScore}/10</td>
                                        <td className="px-4 py-3">
                                            <Badge className={c.passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                                                {c.passed ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(c.checkedAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-[var(--background)] text-[var(--text-secondary)] hover:text-blue-500 transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md hover:bg-[var(--background)] text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-[var(--card)] border-[var(--border)]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[var(--text-primary)]">Delete Quality Check?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[var(--text-secondary)]">
                            This will delete the QC record and revert the batch status back to &quot;quality_check&quot; so it can be re-inspected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-[var(--border)]">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Modal */}
            <Dialog open={!!editCheck} onOpenChange={(open) => !open && setEditCheck(null)}>
                <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[var(--text-primary)]">Edit Quality Check</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            {editCheck?.batch?.batchNumber} — {editCheck?.batch?.product?.name}
                        </DialogDescription>
                    </DialogHeader>

                    {editError && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">{editError}</div>}

                    <div className="space-y-3">
                        {QC_STEPS.map((step) => {
                            const isOptional = step.key === 'labAnalysis';
                            const val = editResults[step.key] || '';
                            return (
                                <div key={step.key} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[var(--text-primary)] text-sm font-medium">
                                            {step.label} {isOptional && <span className="text-[var(--text-muted)] text-xs">(opt)</span>}
                                        </span>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setEditResults(p => ({ ...p, [step.key]: 'pass' }))}
                                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${val === 'pass' ? 'bg-green-500 text-white' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)]'}`}>
                                                ✓ Pass
                                            </button>
                                            <button type="button" onClick={() => setEditResults(p => ({ ...p, [step.key]: 'fail' }))}
                                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${val === 'fail' ? 'bg-red-500 text-white' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)]'}`}>
                                                ✗ Fail
                                            </button>
                                        </div>
                                    </div>
                                    {val && step.key !== 'labAnalysis' && step.key !== 'sfdaCompliance' && (
                                        <Textarea placeholder="Notes..." value={editNotes[step.key] || ''} onChange={(e) => setEditNotes(p => ({ ...p, [step.key]: e.target.value }))}
                                            className="mt-1 bg-[var(--card)] border-[var(--border)] min-h-[32px] text-xs" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {editAllFilled && (
                        <div className={`p-3 rounded-lg border mt-2 ${editPassed ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                            <Badge className={editPassed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                                {editPassed ? 'PASSED' : 'FAILED'}
                            </Badge>
                            <span className="text-[var(--text-primary)] font-semibold ml-2">Score: {editScore}/10</span>
                        </div>
                    )}

                    <div className="mt-2">
                        <Label className="text-xs">General Notes</Label>
                        <Textarea value={editGeneralNotes} onChange={(e) => setEditGeneralNotes(e.target.value)}
                            className="mt-1 bg-[var(--background)] border-[var(--border)] min-h-[40px] text-sm" />
                    </div>

                    <Button onClick={handleSaveEdit} disabled={isSaving || !editAllFilled}
                        className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 mt-2">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
