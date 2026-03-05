'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Home, RefreshCw, Sparkles } from 'lucide-react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    const router = useRouter();
    const params = useParams();
    const businessSlug = params?.businessSlug as string || 'safcha';

    useEffect(() => {
        console.error('Core Dashboard Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
            <div className="max-w-xl w-full text-center space-y-10 relative">
                {/* Background Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[var(--primary)]/5 blur-[100px] -z-10 rounded-full" />

                <div className="space-y-6">
                    <div className="relative inline-block group">
                        <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="w-24 h-24 bg-[var(--card)] border border-red-500/20 rounded-[2rem] flex items-center justify-center shadow-2xl relative transition-transform duration-500 group-hover:rotate-6">
                            <AlertCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 shadow-lg animate-bounce">
                            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight sm:text-5xl leading-tight">
                            Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Connection Interrupted.</span>
                        </h2>
                        <p className="text-lg text-[var(--text-secondary)] font-medium max-w-md mx-auto leading-relaxed opacity-80">
                            We're having trouble synchronizing your dashboard data. Please reload to re-establish a secure connection.
                        </p>
                    </div>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="group relative">
                        <div className="absolute inset-0 bg-red-500/5 blur-lg rounded-2xl" />
                        <div className="relative p-6 bg-[var(--muted)]/20 border border-red-500/10 rounded-2xl text-left overflow-hidden">
                            <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                System Diagnostics
                            </div>
                            <code className="text-[11px] font-mono text-red-400 leading-relaxed block overflow-x-auto whitespace-pre">
                                {error.stack || error.message || 'Unknown system state'}
                            </code>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button
                        onClick={reset}
                        className="h-14 px-10 rounded-2xl bg-[var(--primary)] text-black font-black uppercase tracking-widest text-[11px] hover:bg-[var(--primary)]/90 shadow-2xl shadow-[var(--primary)]/20 transition-all active:scale-95 flex items-center gap-3 w-full sm:w-auto"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reconnect Now
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => router.refresh()}
                        className="h-14 px-10 rounded-2xl border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] font-black uppercase tracking-widest text-[11px] hover:bg-[var(--muted)] transition-all active:scale-95 flex items-center gap-3 w-full sm:w-auto"
                    >
                        Refresh Page
                    </Button>
                </div>

                <div className="pt-4">
                    <button
                        onClick={() => window.location.href = '/select-business'}
                        className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        Switch Workspace
                    </button>
                </div>
            </div>
        </div>
    );
}
