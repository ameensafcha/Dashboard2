'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    FolderTree,
    Coffee,
    Tag,
    Package,
    Factory,
    ClipboardCheck,
    Users,
    ShoppingCart,
    CheckCircle2,
    Truck,
    DollarSign,
    LineChart,
    ArrowDown,
    Sparkles,
    PlayCircle
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FlowStep {
    icon: any;
    title: string;
    action: string;
    description: string;
    color: string;
    isMilestone?: boolean;
}

export function SoftwareFlowDialog({ children }: { children?: React.ReactNode }) {
    const { isRTL } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    const flowSteps: FlowStep[] = [
        {
            icon: FolderTree,
            title: "START: SETUP CATEGORIES",
            action: "Step 1",
            description: "Define your business domains (e.g., Powder, Spices). Everything starts here.",
            color: "bg-blue-500 text-white",
            isMilestone: true
        },
        {
            icon: Coffee,
            title: "CREATE PRODUCTS",
            action: "Step 2",
            description: "Assign products to categories and set their SKUs and SFDA records.",
            color: "bg-orange-500 text-white",
        },
        {
            icon: Tag,
            title: "SET PRICING TIERS",
            action: "Step 3",
            description: "Define Retail, Wholesale, and Distributor prices for your products.",
            color: "bg-purple-500 text-white",
        },
        {
            icon: Package,
            title: "ADD RAW MATERIALS",
            action: "Step 4",
            description: "Input your inventory of ingredients and packaging supplies.",
            color: "bg-green-500 text-white",
        },
        {
            icon: Factory,
            title: "START PRODUCTION",
            action: "Step 5",
            description: "Create a Production Batch. System automatically calculates raw material needs.",
            color: "bg-teal-500 text-white",
            isMilestone: true
        },
        {
            icon: ClipboardCheck,
            title: "QUALITY INSPECTION",
            action: "Step 6",
            description: "Verify weight, taste, and safety. Batch is either Passed or Rejected.",
            color: "bg-yellow-500 text-white",
        },
        {
            icon: CheckCircle2,
            title: "INVENTORY ADMISSION",
            action: "Step 7",
            description: "If quality passes, finished product stock increases. Raw materials are deducted.",
            color: "bg-emerald-500 text-white",
        },
        {
            icon: Users,
            title: "CLIENT MANAGEMENT (CRM)",
            action: "Step 8",
            description: "Add companies and leads to your sales pipeline.",
            color: "bg-indigo-500 text-white",
            isMilestone: true
        },
        {
            icon: ShoppingCart,
            title: "CREATE SALES ORDER",
            action: "Step 9",
            description: "Choose a client. System auto-applies their specific pricing tier.",
            color: "bg-pink-500 text-white",
        },
        {
            icon: CheckCircle2,
            title: "FINALIZE & RESERVE",
            action: "Step 10",
            description: "Confirm the order. Invoices are generated and stock is reserved.",
            color: "bg-cyan-500 text-white",
        },
        {
            icon: Truck,
            title: "SHIPMENT & LOGISTICS",
            action: "Step 11",
            description: "Mark order as shipped. Stock is officially removed from inventory count.",
            color: "bg-sky-500 text-white",
        },
        {
            icon: DollarSign,
            title: "DELIVERY & REVENUE",
            action: "Step 12",
            description: "Mark as delivered. Revenue transaction is automatically recorded.",
            color: "bg-amber-500 text-white",
            isMilestone: true
        },
        {
            icon: LineChart,
            title: "CEO INSIGHTS",
            action: "Step 13",
            description: "Check P&L and KPIs on the Dashboard. Your entire cycle is complete!",
            color: "bg-rose-500 text-white",
        },
    ];

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[95vh] p-0 overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-2xl">
                <DialogHeader className="p-6 border-b border-[var(--border)] bg-[var(--muted)]/20">
                    <div className="flex items-center gap-2 mb-1">
                        <PlayCircle className="w-4 h-4 text-[var(--accent-gold)]" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Operational Guide</span>
                    </div>
                    <DialogTitle className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight">
                        Step-by-Step Software Flow
                    </DialogTitle>
                    <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                        Follow this vertical sequence to understand exactly how to use the system.
                    </p>
                </DialogHeader>

                <ScrollArea className="px-6 py-8 h-full max-h-[calc(95vh-120px)]">
                    <div className="relative pb-10">
                        {/* Continuous Line */}
                        <div className="absolute left-8 rtl:left-auto rtl:right-8 top-0 bottom-0 w-1 bg-[var(--border)] rounded-full -z-10" />

                        <div className="space-y-0">
                            {flowSteps.map((step, index) => (
                                <div key={index}>
                                    <div className="flex gap-6 items-start py-4 group">
                                        {/* Circle + Icon */}
                                        <div className={`relative flex-shrink-0 w-16 h-16 rounded-full ${step.color} flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.1)] border-4 border-[var(--card)] z-10 transition-transform group-hover:scale-110`}>
                                            <step.icon className="w-7 h-7" />
                                            {step.isMilestone && (
                                                <div className="absolute -top-1 -right-1 bg-[var(--accent-gold)] rounded-full p-1 shadow-md">
                                                    <Sparkles className="w-3 h-3 text-[var(--card)]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pt-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black bg-[var(--foreground)] text-[var(--card)] px-1.5 py-0.5 rounded uppercase letter tracking-[0.05em]">
                                                    {step.action}
                                                </span>
                                                <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wide">
                                                    {step.title}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium pr-6 rtl:pr-0 rtl:pl-6">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Explicit Arrow with "NEXT" Text */}
                                    {index < flowSteps.length - 1 && (
                                        <div className="ml-8 rtl:ml-0 rtl:mr-8 flex items-center gap-3 py-1">
                                            <div className="w-px h-8 bg-gradient-to-b from-[var(--border)] to-transparent ml-[3px] rtl:ml-0 rtl:mr-[3px]" />
                                            <div className="flex items-center gap-1.5 opacity-40 group">
                                                <ArrowDown className="w-4 h-4 text-[var(--accent-gold)] animate-bounce" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Next Step</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 rounded-xl bg-[var(--accent-gold)]/5 border border-[var(--accent-gold)]/20 text-center">
                            <CheckCircle2 className="w-6 h-6 text-[var(--accent-gold)] mx-auto mb-2" />
                            <h4 className="text-xs font-black text-[var(--foreground)] uppercase">Process Complete!</h4>
                            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">Your business is now running on Safcha OS.</p>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
