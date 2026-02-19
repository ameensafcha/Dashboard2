'use client';

import { useState, useEffect } from 'react';
import { updateRnDProject, deleteRnDProject, RndProjectType } from '@/app/actions/production';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { Trash2, Edit2, Save, X } from 'lucide-react';

interface RnDDetailModalProps {
    project: RndProjectType | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function RnDDetailModal({ project, isOpen, onClose }: RnDDetailModalProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || '',
                category: project.category || '',
                status: project.status || 'ideation',
                leadId: project.leadId || '',
                formulationDetails: project.formulationDetails || '',
                testResults: project.testResults || '',
                costEstimate: project.costEstimate || 0,
                targetLaunchDate: project.targetLaunchDate ? new Date(project.targetLaunchDate).toISOString().split('T')[0] : '',
                relatedSuppliers: project.relatedSuppliers?.list || '',
                attachments: project.attachments?.uri || '',
                notes: project.notes || '',
            });
            setIsEditing(false); // Reset edit state when opening a new project
        }
    }, [project, isOpen]);

    if (!project) return null;

    const handleSave = async () => {
        if (!formData.name || !formData.category) {
            toast({ title: 'Validation Error', description: 'Project Name and Category are required.', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await updateRnDProject(project.id, {
                ...formData,
                costEstimate: formData.costEstimate || undefined,
                targetLaunchDate: formData.targetLaunchDate ? new Date(formData.targetLaunchDate) : undefined,
                leadId: formData.leadId || undefined,
                relatedSuppliers: formData.relatedSuppliers ? { list: formData.relatedSuppliers } : undefined,
                attachments: formData.attachments ? { uri: formData.attachments } : undefined,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Project updated successfully' });
                setIsEditing(false);
                router.refresh();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to update project', type: 'error' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this R&D project? This action cannot be undone.')) return;

        setIsSubmitting(true);
        try {
            const result = await deleteRnDProject(project.id);
            if (result.success) {
                toast({ title: 'Deleted', description: 'Project removed successfully' });
                onClose();
                router.refresh();
            } else {
                toast({ title: 'Error', description: 'Failed to delete project', type: 'error' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) onClose();
        }}>
            <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-border bg-background shadow-2xl sm:rounded-xl">
                <DialogHeader className="px-6 py-5 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {isEditing ? 'Edit Project Details' : project.name}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                            {project.category} • Created {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    {!isEditing && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isSubmitting}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </DialogHeader>

                <div className="px-6 py-6 overflow-y-auto max-h-[72vh] space-y-8">
                    {/* CORE INFO */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Core Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                            <div>
                                <Label className="text-xs text-muted-foreground">Project Name</Label>
                                {isEditing ? (
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                ) : (
                                    <p className="font-medium mt-1">{project.name}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Category</Label>
                                {isEditing ? (
                                    <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="New Flavor">New Flavor</SelectItem>
                                            <SelectItem value="New Product Line">New Product Line</SelectItem>
                                            <SelectItem value="Improvement">Improvement</SelectItem>
                                            <SelectItem value="Research">Research</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="font-medium mt-1">{project.category}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Lead Researcher</Label>
                                {isEditing ? (
                                    <Input value={formData.leadId} onChange={e => setFormData({ ...formData, leadId: e.target.value })} />
                                ) : (
                                    <p className="font-medium mt-1">{project.leadId || '-'}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Status</Label>
                                {isEditing ? (
                                    <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ideation">Ideation</SelectItem>
                                            <SelectItem value="formulation">Formulation</SelectItem>
                                            <SelectItem value="testing">Testing</SelectItem>
                                            <SelectItem value="sfda_submission">SFDA Submission</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="font-medium mt-1 capitalize">{project.status.replace('_', ' ')}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Target Launch Date</Label>
                                {isEditing ? (
                                    <Input type="date" value={formData.targetLaunchDate} onChange={e => setFormData({ ...formData, targetLaunchDate: e.target.value })} />
                                ) : (
                                    <p className="font-medium mt-1">{project.targetLaunchDate ? new Date(project.targetLaunchDate).toLocaleDateString() : '-'}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Cost Estimate</Label>
                                {isEditing ? (
                                    <Input type="number" step="0.01" value={formData.costEstimate} onChange={e => setFormData({ ...formData, costEstimate: parseFloat(e.target.value) || 0 })} />
                                ) : (
                                    <p className="font-medium mt-1">{project.costEstimate ? `SAR ${project.costEstimate}` : '-'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FORMULATION & TESTING */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Formulation & Testing</h3>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Formulation Details / Recipe</Label>
                                {isEditing ? (
                                    <Textarea className="mt-1" minLength={100} value={formData.formulationDetails} onChange={e => setFormData({ ...formData, formulationDetails: e.target.value })} />
                                ) : (
                                    <div className="mt-1 p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap border border-border">
                                        {project.formulationDetails || <span className="text-muted-foreground italic">No details provided.</span>}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Test Results</Label>
                                {isEditing ? (
                                    <Textarea className="mt-1" value={formData.testResults} onChange={e => setFormData({ ...formData, testResults: e.target.value })} />
                                ) : (
                                    <div className="mt-1 p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap border border-border">
                                        {project.testResults || <span className="text-muted-foreground italic">No results yet.</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COMPLIANCE & LOGISTICS */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Logistics & Compliance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                            <div>
                                <Label className="text-xs text-muted-foreground">Related Suppliers</Label>
                                {isEditing ? (
                                    <Input value={formData.relatedSuppliers} onChange={e => setFormData({ ...formData, relatedSuppliers: e.target.value })} />
                                ) : (
                                    <p className="font-medium mt-1">{project.relatedSuppliers?.list || '-'}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Attachments</Label>
                                {isEditing ? (
                                    <Input value={formData.attachments} onChange={e => setFormData({ ...formData, attachments: e.target.value })} />
                                ) : (
                                    <p className="font-medium mt-1">
                                        {project.attachments?.uri ? (
                                            <a href={project.attachments.uri} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Attachment</a>
                                        ) : '-'}
                                    </p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <Label className="text-xs text-muted-foreground">Notes (SFDA)</Label>
                                {isEditing ? (
                                    <Textarea className="mt-1" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                ) : (
                                    <p className="font-medium mt-1 text-sm">{project.notes || '-'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSubmitting} className="bg-[#E8A838] hover:bg-[#d49a2d] text-black shadow-sm">
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
