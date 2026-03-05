'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { UploadCloud, FileType, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDocumentsStore } from '@/stores/documentsStore';
import { uploadDocument } from '@/app/actions/documents/documents';
import { DocumentCategory } from '@prisma/client';
// For a real production app we'd integrate AWS S3 / Supabase Storage uploads here. 
// We will stub the actual file upload and just submit the metadata with a fake URL for now,
// as the PRD doesn't configure a specific storage bucket provider explicitly yet.

export default function UploadDocumentModal({ onUploaded }: { onUploaded: () => void }) {
    const { t, isRTL } = useTranslation();
    const { isUploadModalOpen, setIsUploadModalOpen } = useDocumentsStore();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<DocumentCategory>('OTHER');
    const [file, setFile] = useState<File | null>(null);

    const resetForm = () => {
        setTitle('');
        setCategory('OTHER');
        setFile(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            if (!title) {
                // Auto-fill title from filename without extension
                setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !file) {
            toast({ title: 'Error', description: 'Title and file are required', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            // Fake upload delay
            await new Promise(r => setTimeout(r, 800));

            // Mocking a file URL since we don't have bucket configured
            const fakeFileUrl = `https://storage.safcha.com/mock/${file.name}`;

            const result = await uploadDocument({
                title,
                category,
                fileUrl: fakeFileUrl,
                fileType: file.type || 'application/octet-stream',
                fileSize: file.size,
                tags: []
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Document uploaded successfully' });
                setIsUploadModalOpen(false);
                resetForm();
                onUploaded();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to upload', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isUploadModalOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsUploadModalOpen(open);
        }}>
            <DialogContent className="max-w-xl p-0 bg-[var(--card)] border-[var(--border)] overflow-hidden z-[100]">
                <DialogHeader className="sr-only">
                    <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>

                <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-sm">
                            <UploadCloud className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Upload Document</h2>
                            <p className="text-sm text-[var(--text-secondary)] font-medium">Securely store files in the vault.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Drop Area (Simple version) */}
                        <div className="w-full relative">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={isSaving}
                            />
                            <div className={cn(
                                "border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-colors text-center",
                                file ? "border-emerald-500/50 bg-emerald-500/5" : "border-[var(--border)] bg-[var(--muted)]/20 hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5"
                            )}>
                                {file ? (
                                    <>
                                        <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                                        <p className="text-sm font-black text-[var(--text-primary)]">{file.name}</p>
                                        <p className="text-xs font-bold text-[var(--text-disabled)] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-10 h-10 text-[var(--text-disabled)] mb-3" />
                                        <p className="text-sm font-bold text-[var(--text-secondary)]">Click or drag file here to upload</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-disabled)] mt-2">Max limit: 50MB</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {file && (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Document Title *</Label>
                                    <Input
                                        placeholder="e.g. Q3 Financial Report"
                                        className="bg-[var(--background)] border-[var(--border)] h-12 rounded-xl focus:ring-[var(--primary)] font-bold"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Category</Label>
                                    <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                                        <SelectTrigger className="bg-[var(--background)] border-[var(--border)] h-12 rounded-xl font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[200]">
                                            {Object.values(DocumentCategory).map(c => (
                                                <SelectItem key={c} value={c} className="font-bold">{c.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsUploadModalOpen(false)}
                                disabled={isSaving}
                                className="h-11 px-6 rounded-xl border-[var(--border)] font-bold uppercase tracking-widest text-[11px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving || !file}
                                className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[var(--primary)]/20"
                            >
                                {isSaving ? 'Uploading...' : 'Save Document'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
