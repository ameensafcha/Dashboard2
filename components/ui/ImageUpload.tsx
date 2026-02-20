"use client";

import React, { useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove: () => void;
    className?: string;
}

export function ImageUpload({ value, onChange, onRemove, className }: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            // In a real application, you would upload the file to your storage provider here (e.g. AWS S3, Supabase Storage, Cloudinary)
            // For now, we will create a temporary local object URL to display the image for the demo.
            const tempUrl = URL.createObjectURL(file);
            onChange(tempUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    if (value) {
        return (
            <div className={`relative w-full h-full min-h-[150px] rounded-xl overflow-hidden group ${className}`}>
                <img
                    src={value}
                    alt="Uploaded variant image"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={triggerUpload}
                        className="bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-sm"
                    >
                        Change
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
            </div>
        );
    }

    return (
        <div
            onClick={triggerUpload}
            className={`flex flex-col items-center justify-center w-full h-full min-h-[150px] p-6 text-center cursor-pointer transition-colors hover:bg-[var(--muted)]/80 ${className || ''}`}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            {isUploading ? (
                <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-[#E8A838] animate-spin mb-2" />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Uploading...</span>
                </div>
            ) : (
                <>
                    <div className="h-12 w-12 rounded-full bg-[#E8A838]/10 flex items-center justify-center mb-3 group-hover:bg-[#E8A838]/20 transition-colors">
                        <Upload className="h-6 w-6 text-[#E8A838]" />
                    </div>
                    <span className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                        Click to upload
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        SVG, PNG, JPG or GIF (max. 2MB)
                    </span>
                </>
            )}
        </div>
    );
}
