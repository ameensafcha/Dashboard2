'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
    FileText,
    Search,
    UploadCloud,
    Folder,
    MoreVertical,
    Download,
    Trash2,
    Image as ImageIcon,
    FileSpreadsheet,
    FileCode,
    FileArchive
} from "lucide-react";
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useQuery } from '@tanstack/react-query';
import { getDocuments, deleteDocument } from '@/app/actions/documents/documents';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocumentsStore } from '@/stores/documentsStore';
import UploadDocumentModal from './UploadDocumentModal';
import { DocumentCategory } from '@prisma/client';
import { toast } from '@/components/ui/toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface DocumentsVaultProps {
    initialDocuments: any[];
    businessSlug: string;
}

export default function DocumentsVaultClient({ initialDocuments, businessSlug }: DocumentsVaultProps) {
    const { t, isRTL } = useTranslation();
    const { setIsUploadModalOpen } = useDocumentsStore();

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

    const { data: documents, refetch } = useQuery({
        queryKey: ['documents', businessSlug, search, categoryFilter],
        queryFn: () => getDocuments(businessSlug, search, categoryFilter),
        initialData: initialDocuments,
        staleTime: 5_000,
        refetchInterval: 30_000,
    });

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        const res = await deleteDocument(id);
        if (res.success) {
            toast({ title: 'Deleted', description: 'Document removed from vault.' });
            refetch();
        } else {
            toast({ title: 'Error', description: res.error, type: 'error' });
        }
    };

    const getFileIcon = (type: string, url: string) => {
        if (type.includes('image')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
        if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
        if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
        if (type.includes('zip') || type.includes('archive')) return <FileArchive className="w-8 h-8 text-amber-500" />;
        if (type.includes('json') || type.includes('javascript') || type.includes('html')) return <FileCode className="w-8 h-8 text-purple-500" />;
        return <FileText className="w-8 h-8 text-zinc-500" />;
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 pt-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Document Vault</h1>
                    <p className="text-sm text-[var(--text-disabled)] mt-1">Secure centralized storage for all company files.</p>
                </div>
                <PermissionGuard module="crm" action="create">
                    <Button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[var(--primary)]/20"
                    >
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Upload File
                    </Button>
                </PermissionGuard>
            </div>

            {/* Toolbar */}
            <div className="px-6">
                <div className="p-4 border border-[var(--border)] bg-[var(--card)] rounded-2xl flex flex-col sm:flex-row justify-between gap-4 shadow-sm">
                    <div className="relative w-full sm:w-[400px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
                        <Input
                            placeholder="Find documents by name or tag..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-10 bg-[var(--muted)]/30 border-[var(--border)] rounded-xl font-medium focus:ring-[var(--primary)]"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[180px] h-10 bg-[var(--muted)]/30 border-[var(--border)] rounded-xl font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--card)] border-[var(--border)] z-[100]">
                                <SelectItem value="ALL" className="font-bold text-xs">All Categories</SelectItem>
                                {Object.values(DocumentCategory).map(c => (
                                    <SelectItem key={c} value={c} className="font-bold text-xs">{c.replace('_', ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Grid View of Documents */}
            <div className="px-6">
                {documents?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                        <Folder className="w-16 h-16 text-[var(--muted)]/50 mb-4" />
                        <h3 className="text-xl font-black text-[var(--text-secondary)]">Vault is empty</h3>
                        <p className="text-sm font-medium text-[var(--text-disabled)] mt-2">Upload your first document to get started.</p>
                        <Button onClick={() => setIsUploadModalOpen(true)} className="mt-6 bg-[var(--primary)] rounded-xl uppercase tracking-widest text-[10px] font-black h-10 text-white">
                            Upload Now
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {documents?.map(doc => (
                            <Card key={doc.id} className="group relative break-inside-avoid overflow-hidden bg-[var(--card)] border-[var(--border)] rounded-2xl hover:border-[var(--primary)]/40 transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col">
                                {/* File Icon / Preview Area */}
                                <div className="h-40 bg-[var(--muted)]/30 flex items-center justify-center border-b border-[var(--border)]/50 relative overflow-hidden group-hover:bg-[var(--primary)]/5 transition-colors">
                                    <div className="transform group-hover:scale-110 transition-transform duration-500">
                                        {getFileIcon(doc.fileType, doc.fileUrl)}
                                    </div>
                                    {/* Action Overlay */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/90 shadow-sm text-black border-0 hover:bg-white backdrop-blur-sm">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 bg-[var(--card)] border-[var(--border)] z-[200]">
                                                <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')} className="font-bold text-xs cursor-pointer">
                                                    <Download className="w-4 h-4 mr-2" /> Download
                                                </DropdownMenuItem>
                                                <PermissionGuard module="crm" action="delete">
                                                    <DropdownMenuItem onClick={() => handleDelete(doc.id, doc.title)} className="font-bold text-xs text-red-500 focus:text-red-500 cursor-pointer">
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </PermissionGuard>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <span className="inline-block px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest bg-[var(--muted)] text-[var(--text-disabled)] border border-[var(--border)] mb-2">
                                            {doc.category.replace('_', ' ')}
                                        </span>
                                        <h3 className="text-sm font-black text-[var(--text-primary)] leading-tight mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-2" title={doc.title}>
                                            {doc.title}
                                        </h3>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-wider">
                                        <span>{formatBytes(doc.fileSize)}</span>
                                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <UploadDocumentModal onUploaded={refetch} />
        </div>
    );
}
