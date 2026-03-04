'use client';

import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/lib/i18n';
import { ShieldAlert, Building2, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePage() {
    const { user } = useAppStore();
    const { t } = useTranslation();

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-[var(--card)] rounded-3xl border border-[var(--border)] p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent-gold)]/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--accent-gold)]/5 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-2xl bg-[var(--accent-gold)]/10 flex items-center justify-center">
                        <UserCircle className="w-12 h-12 text-[var(--accent-gold)]" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
                            Welcome, {user?.name || 'User'}!
                        </h1>
                        <p className="text-[var(--text-muted)] text-lg">
                            You have successfully joined <span className="text-[var(--foreground)] font-semibold">{user?.businessName || 'the business'}</span>.
                        </p>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 w-full flex items-start gap-4 text-start">
                        <ShieldAlert className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold text-amber-500">Awaiting Role Assignment</p>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                Your account is active, but you don't have permission to access specific modules (like Sales, Inventory, or Finance) yet.
                                Please contact your <span className="text-[var(--foreground)] font-medium underline decoration-[var(--accent-gold)]/30">System Administrator</span> to request access to the modules you need.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4">
                        <Link
                            href="/select-business"
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--muted)] hover:bg-[var(--border)] transition-colors font-semibold border border-[var(--border)]"
                        >
                            <Building2 className="w-4 h-4" />
                            Switch Business
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 rounded-xl bg-[var(--accent-gold)] text-black font-bold hover:opacity-90 transition-all shadow-lg shadow-[var(--accent-gold)]/20"
                        >
                            Check Permissions Again
                        </button>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] pt-4">
                        If you believe this is an error, try logging out and logging back in.
                    </p>
                </div>
            </div>
        </div>
    );
}
