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

export default function QCForm({ batchId }: { batchId: string }) {
    const router = useRouter();
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
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mt-6">
            <div className="px-5 py-4 border-b border-gray-200 bg-[#F5F5F0]">
                <h3 className="font-semibold text-gray-900 text-lg">Quality Control Checklist (5-Point)</h3>
                <p className="text-sm text-gray-500">Perform the mandatory QC inspection before approving this batch.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visual */}
                    <div className="space-y-3 p-4 border rounded-md">
                        <h4 className="font-medium">1. Visual Inspection</h4>
                        <Select value={formData.visualInspection} onValueChange={(v) => setFormData({ ...formData, visualInspection: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pass">Pass (Color, Fineness, Packaging OK)</SelectItem>
                                <SelectItem value="fail">Fail (Defects found)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Notes on appearance..."
                            value={formData.visualNotes}
                            onChange={(e) => setFormData({ ...formData, visualNotes: e.target.value })}
                        />
                    </div>

                    {/* Weight */}
                    <div className="space-y-3 p-4 border rounded-md">
                        <h4 className="font-medium">2. Weight Verification</h4>
                        <Select value={formData.weightVerification} onValueChange={(v) => setFormData({ ...formData, weightVerification: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pass">Pass (Matches target weight ±2%)</SelectItem>
                                <SelectItem value="fail">Fail (Out of tolerance)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Notes on weight sampling..."
                            value={formData.weightNotes}
                            onChange={(e) => setFormData({ ...formData, weightNotes: e.target.value })}
                        />
                    </div>

                    {/* Taste/Aroma */}
                    <div className="space-y-3 p-4 border rounded-md">
                        <h4 className="font-medium">3. Taste / Aroma Test</h4>
                        <Select value={formData.tasteTest} onValueChange={(v) => setFormData({ ...formData, tasteTest: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pass">Pass (Standard taste profile)</SelectItem>
                                <SelectItem value="fail">Fail (Off notes detected)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Notes on flavor profile..."
                            value={formData.tasteNotes}
                            onChange={(e) => setFormData({ ...formData, tasteNotes: e.target.value })}
                        />
                    </div>

                    {/* SFDA */}
                    <div className="space-y-3 p-4 border rounded-md">
                        <h4 className="font-medium">4. SFDA Compliance</h4>
                        <Select value={formData.sfdaCompliance} onValueChange={(v) => setFormData({ ...formData, sfdaCompliance: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pass">Pass (Labels & Expiry OK)</SelectItem>
                                <SelectItem value="fail">Fail (Missing or incorrect markings)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Notes on packaging compliance..."
                            value={formData.labAnalysis}
                            onChange={(e) => setFormData({ ...formData, labAnalysis: e.target.value })}
                        />
                    </div>
                </div>

                <div className="p-4 border rounded-md bg-gray-50 flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/3">
                        <Label className="font-medium">5. Overall Score (1-10)</Label>
                        <Input
                            type="number"
                            min={1} max={10}
                            className="mt-2"
                            value={formData.overallScore}
                            onChange={(e) => setFormData({ ...formData, overallScore: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>
                    <div className="w-full md:w-2/3">
                        <Label className="font-medium">Final Notes / Conclusions</Label>
                        <Textarea
                            className="mt-2"
                            placeholder="Any major conclusions about this batch..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#2D6A4F] hover:bg-[#1e4b37] text-white px-8"
                    >
                        {isSubmitting ? 'Sumitting...' : 'Submit QC Report'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
