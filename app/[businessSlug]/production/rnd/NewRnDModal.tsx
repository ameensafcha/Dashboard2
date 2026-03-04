'use client';

import { useState } from 'react';
import { createRnDProject } from '@/app/actions/production';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { useProductionStore } from '@/stores/productionStore';

export default function NewRnDModal() {
    const router = useRouter();
    const { isRnDModalOpen, setIsRnDModalOpen } = useProductionStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        status: 'ideation',
        leadId: '',
        formulationDetails: '',
        testResults: '',
        costEstimate: 0,
        targetLaunchDate: '',
        relatedSuppliers: '',
        attachments: '',
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.category) {
            toast({ title: 'Error', description: 'Name and Category are required.', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createRnDProject({
                ...formData,
                costEstimate: formData.costEstimate || undefined,
                targetLaunchDate: formData.targetLaunchDate ? new Date(formData.targetLaunchDate) : undefined,
                leadId: formData.leadId || undefined,
                relatedSuppliers: formData.relatedSuppliers ? { list: formData.relatedSuppliers } : undefined,
                attachments: formData.attachments ? { uri: formData.attachments } : undefined,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'R&D project created successfully' });
                setIsRnDModalOpen(false);
                setFormData({
                    name: '',
                    category: '',
                    status: 'ideation',
                    leadId: '',
                    formulationDetails: '',
                    testResults: '',
                    costEstimate: 0,
                    targetLaunchDate: '',
                    relatedSuppliers: '',
                    attachments: '',
                    notes: '',
                });
                router.refresh();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to create project', type: 'error' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button onClick={() => setIsRnDModalOpen(true)} className="bg-[#E8A838] hover:bg-[#d49a2d] text-black shadow-sm font-medium">
                <Plus className="w-4 h-4 mr-2" />
                New R&D Project
            </Button>

            <Dialog open={isRnDModalOpen} onOpenChange={setIsRnDModalOpen}>
                <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-border bg-background shadow-2xl sm:rounded-xl">
                    <DialogHeader className="px-6 py-5 border-b border-border bg-muted/30">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            Advanced R&D Project
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            Define new formulations, track testing phases, and manage compliance details.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-6 overflow-y-auto max-h-[72vh] space-y-8">

                            {/* SECTION 1: CORE INFO */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 border-b border-border pb-2">
                                    <div className="w-6 h-6 rounded-md bg-[#E8A838]/10 flex items-center justify-center text-[#E8A838]">
                                        <span className="text-sm font-bold">1</span>
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground tracking-tight">Core Information</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Project Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            className="bg-background focus-visible:ring-[#E8A838]"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Yuzu Lemon Blend"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Category <span className="text-red-500">*</span></Label>
                                        <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                            <SelectTrigger className="bg-background focus:ring-[#E8A838]">
                                                <SelectValue placeholder="Select classification" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="New Flavor">New Flavor</SelectItem>
                                                <SelectItem value="New Product Line">New Product Line</SelectItem>
                                                <SelectItem value="Improvement">Improvement</SelectItem>
                                                <SelectItem value="Research">Research</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Lead Researcher</Label>
                                        <Input
                                            className="bg-background focus-visible:ring-[#E8A838]"
                                            value={formData.leadId}
                                            onChange={e => setFormData({ ...formData, leadId: e.target.value })}
                                            placeholder="e.g. Dr. Ahmed (Staff ID)"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Current Status</Label>
                                        <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                                            <SelectTrigger className="bg-background focus:ring-[#E8A838]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ideation">Ideation</SelectItem>
                                                <SelectItem value="formulation">Formulation</SelectItem>
                                                <SelectItem value="testing">Testing</SelectItem>
                                                <SelectItem value="sfda_submission">SFDA Submission</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            Target Launch Date
                                        </Label>
                                        <Input
                                            type="date"
                                            className="bg-background focus-visible:ring-[#E8A838]"
                                            value={formData.targetLaunchDate}
                                            onChange={e => setFormData({ ...formData, targetLaunchDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            Cost Estimate (per kg)
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">SAR</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="pl-12 bg-background focus-visible:ring-[#E8A838]"
                                                value={formData.costEstimate || ''}
                                                onChange={e => setFormData({ ...formData, costEstimate: parseFloat(e.target.value) || 0 })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: RESEARCH & FORMULATION */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 border-b border-border pb-2">
                                    <div className="w-6 h-6 rounded-md bg-[#2D6A4F]/10 flex items-center justify-center text-[#2D6A4F]">
                                        <span className="text-sm font-bold">2</span>
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground tracking-tight">Formulation & Testing</h3>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Formulation Details / Recipe</Label>
                                        <Textarea
                                            className="min-h-[110px] resize-y bg-background focus-visible:ring-[#2D6A4F]"
                                            value={formData.formulationDetails}
                                            onChange={e => setFormData({ ...formData, formulationDetails: e.target.value })}
                                            placeholder="List exact ingredients, ratios, and processing steps..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Test Results & Feedback</Label>
                                        <Textarea
                                            className="min-h-[90px] resize-y bg-background focus-visible:ring-[#2D6A4F]"
                                            value={formData.testResults}
                                            onChange={e => setFormData({ ...formData, testResults: e.target.value })}
                                            placeholder="Tasting notes, lab reports summary, visual feedback..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: COMPLIANCE & LOGISTICS */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 border-b border-border pb-2">
                                    <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-600">
                                        <span className="text-sm font-bold">3</span>
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground tracking-tight">Logistics & Compliance</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Related Suppliers</Label>
                                        <Input
                                            className="bg-background focus-visible:ring-purple-500"
                                            value={formData.relatedSuppliers}
                                            onChange={e => setFormData({ ...formData, relatedSuppliers: e.target.value })}
                                            placeholder="Primary suppliers for new materials..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Attachments</Label>
                                        <Input
                                            className="bg-background focus-visible:ring-purple-500"
                                            value={formData.attachments}
                                            onChange={e => setFormData({ ...formData, attachments: e.target.value })}
                                            placeholder="Drive links, PDFs, Images..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Additional Notes (SFDA)</Label>
                                    <Textarea
                                        className="min-h-[80px] bg-background focus-visible:ring-purple-500"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Any comments regarding SFDA compliance, regulatory blocks, or general notes..."
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="px-6 py-4 bg-muted/30 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
                            <p className="text-xs text-muted-foreground font-medium text-center sm:text-left w-full sm:w-auto">
                                <span className="text-red-500">*</span> Required fields
                            </p>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsRnDModalOpen(false)} className="px-6 hover:bg-muted">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-[#E8A838] hover:bg-[#d49a2d] text-black font-semibold px-6 shadow-sm">
                                    {isSubmitting ? 'Creating Project...' : 'Create Project'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
