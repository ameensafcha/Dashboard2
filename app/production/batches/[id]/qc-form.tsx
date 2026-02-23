'use client';

import { useState } from 'react';
import { createQualityCheck } from '@/app/actions/production';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { CheckCircle2, AlertTriangle, ClipboardCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QCForm({ batchId }: { batchId: string }) {
    const router = useRouter();
    const { t, isRTL } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        visualInspection: 'pass',
        visualNotes: '',
        weightVerification: 'pass',
        weightNotes: '',
        tasteTest: 'pass',
        tasteNotes: '',
        labAnalysis: '',
        sfdaCompliance: 'pass',
        overallScore: 10,
        actualQty: 0,
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.actualQty <= 0) {
            toast({ title: 'Error', description: 'Please enter a valid actual quantity', type: 'error' });
            return;
        }
        setIsSubmitting(true);
        try {
            // Calculate passed status based on all 4 required points
            const isPassed =
                formData.visualInspection === 'pass' &&
                formData.weightVerification === 'pass' &&
                formData.tasteTest === 'pass' &&
                formData.sfdaCompliance === 'pass' &&
                formData.overallScore >= 7;

            const result = await createQualityCheck({
                batchId,
                ...formData,
                passed: isPassed,
                checkedAt: new Date(),
            });

            if (result.success) {
                toast({ title: 'Success', description: 'QC results submitted successfully' });
                router.refresh();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to submit QC', type: 'error' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-8 py-6 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <div className={cn("flex items-center gap-3 mb-1", isRTL ? "flex-row-reverse" : "")}>
                    <ClipboardCheck className="w-5 h-5 text-[#E8A838]" />
                    <h3 className="font-black text-[var(--text-primary)] text-xl tracking-tight">Quality Control Checklist (5-Point)</h3>
                </div>
                <p className={cn("text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]", isRTL ? "text-right" : "")}>
                    Perform the mandatory QC inspection before approving this batch.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visual */}
                    <div className="space-y-4 p-6 bg-[var(--muted)]/20 border border-[var(--border)] rounded-2xl transition-all hover:border-[#E8A838]/30 group">
                        <div className={cn("flex items-center gap-2 mb-2", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-6 h-6 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[10px] font-black group-hover:bg-[#E8A838] group-hover:text-black transition-all">1</div>
                            <h4 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">Visual Inspection</h4>
                        </div>
                        <Select value={formData.visualInspection} onValueChange={(v) => setFormData({ ...formData, visualInspection: v })}>
                            <SelectTrigger className="bg-[var(--card)] border-[var(--border)] h-11 focus:ring-[#E8A838]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
                                <SelectItem value="pass">Pass (Color, Fineness, Packaging OK)</SelectItem>
                                <SelectItem value="fail">Fail (Defects found)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Notes on appearance..."
                            className="bg-[var(--card)] border-[var(--border)] h-11 focus:ring-[#E8A838]"
                            value={formData.visualNotes}
                            onChange={(e) => setFormData({ ...formData, visualNotes: e.target.value })}
                        />
                    </div>

                    {/* Weight */}
                    <div className="space-y-4 p-6 bg-[var(--muted)]/20 border border-[var(--border)] rounded-2xl transition-all hover:border-[#E8A838]/30 group">
                        <div className={cn("flex items-center gap-2 mb-2", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-6 h-6 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[10px] font-black group-hover:bg-[#E8A838] group-hover:text-black transition-all">2</div>
                            <h4 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">Weight Verification</h4>
                        </div>
                        <Select value={formData.weightVerification} onValueChange={(v) => setFormData({ ...formData, weightVerification: v })}>
                            <SelectTrigger className="bg-[var(--card)] border-[var(--border)] h-11 focus:ring-[#E8A838]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
                                <SelectItem value="pass">Pass (Matches target weight ±2%)</SelectItem>
                                <SelectItem value="fail">Fail (Out of tolerance)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Notes on weight sampling..."
                            className="bg-[var(--card)] border-[var(--border)] h-11 focus:ring-[#E8A838]"
                            value={formData.weightNotes}
                            onChange={(e) => setFormData({ ...formData, weightNotes: e.target.value })}
                        />
                    </div>

                    {/* Taste/Aroma */}
                    <div className="space-y-4 p-6 bg-[var(--muted)]/20 border border-[var(--border)] rounded-2xl transition-all hover:border-[#E8A838]/30 group">
                        <div className={cn("flex items-center gap-2 mb-2", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-6 h-6 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[10px] font-black group-hover:bg-[#E8A838] group-hover:text-black transition-all">3</div>
                            <h4 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">Taste / Aroma Test</h4>
                        </div>
                        <Select value={formData.tasteTest} onValueChange={(v) => setFormData({ ...formData, tasteTest: v })}>
                            <SelectTrigger className="bg-[var(--card)] border-[var(--border)] h-11 focus:ring-[#E8A838]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
                                <SelectItem value="pass">Pass (Standard taste profile)</SelectItem>
                                <SelectItem value="fail">Fail (Off notes detected)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Notes on flavor profile..."
                            className="bg-[var(--card)] border-[var(--border)] h-11 focus:ring-[#E8A838]"
                            value={formData.tasteNotes}
                            onChange={(e) => setFormData({ ...formData, tasteNotes: e.target.value })}
                        />
                    </div>

                    {/* SFDA */}
                    <div className="space-y-4 p-6 bg-[var(--muted)]/20 border border-[var(--border)] rounded-2xl transition-all hover:border-[#E8A838]/30 group">
                        <div className={cn("flex items-center gap-2 mb-2", isRTL ? "flex-row-reverse" : "")}>
                            <div className="w-6 h-6 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[10px] font-black group-hover:bg-[#E8A838] group-hover:text-black transition-all">4</div>
                            <h4 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">SFDA Compliance</h4>
                        </div>
                        <Select value={formData.sfdaCompliance} onValueChange={(v) => setFormData({ ...formData, sfdaCompliance: v })}>
                            <SelectTrigger className="bg-[var(--card)] border-[var(--border)] h-11 focus:ring-[#E8A838]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[105] bg-[var(--card)] border-[var(--border)]">
                                <SelectItem value="pass">Pass (Labels & Expiry OK)</SelectItem>
                                <SelectItem value="fail">Fail (Missing or incorrect markings)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Notes on packaging compliance..."
                            className="bg-[var(--card)] border-[var(--border)] h-11 focus:ring-[#E8A838]"
                            value={formData.labAnalysis}
                            onChange={(e) => setFormData({ ...formData, labAnalysis: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 p-6 bg-[#E8A838]/5 border border-[#E8A838]/20 rounded-2xl group">
                        <div className={cn("flex items-center gap-2 mb-2", isRTL ? "flex-row-reverse" : "")}>
                            <ClipboardCheck className="w-5 h-5 text-[#E8A838]" />
                            <h4 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">{t.actualQtyKg} <span className="text-red-500">*</span></h4>
                        </div>
                        <Input
                            type="number"
                            step="0.1"
                            placeholder={t.actualOutput}
                            className="bg-[var(--card)] border-[var(--border)] h-12 text-xl font-black text-[#E8A838] focus:ring-[#E8A838]"
                            value={formData.actualQty || ''}
                            onChange={(e) => setFormData({ ...formData, actualQty: parseFloat(e.target.value) || 0 })}
                            required
                        />
                    </div>
                </div>

                <div className="p-8 bg-[var(--muted)]/30 border border-[var(--border)] rounded-3xl flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#E8A838]" />
                    <div className="w-full md:w-[240px]">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">5. Overall Score (1-10)</Label>
                        <Input
                            type="number"
                            min={1} max={10}
                            className="bg-[var(--card)] border-[var(--border)] text-3xl font-black h-16 text-[#E8A838] focus:ring-[#E8A838]"
                            value={formData.overallScore}
                            onChange={(e) => setFormData({ ...formData, overallScore: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Final Notes / Conclusions</Label>
                        <Textarea
                            className="bg-[var(--card)] border-[var(--border)] min-h-[100px] focus:ring-[#E8A838] transition-all"
                            placeholder="Any major conclusions about this batch..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-[var(--border)] flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#E8A838] hover:bg-[#d49a2d] text-black px-12 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#E8A838]/20 transition-all active:scale-95 gap-3"
                    >
                        {isSubmitting ? 'Sumitting...' : 'Submit QC Report'}
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
