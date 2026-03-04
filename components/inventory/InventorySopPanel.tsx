'use client';

import { useState } from 'react';
import {
    PackageCheck, ClipboardList, FlaskConical, Box, ShoppingCart,
    ChevronDown, ChevronUp, BookOpen, ArrowRight,
} from 'lucide-react';

const STEPS = [
    {
        icon: PackageCheck,
        color: '#3b82f6',
        title: 'Receive Raw Material',
        desc: 'Supplier delivers ingredients (e.g. Dates, Nuts). Check the quantity and inspect for quality.',
        action: 'Go to Inventory → Raw Materials → Add New Material',
    },
    {
        icon: ClipboardList,
        color: '#E8A838',
        title: 'Log in System',
        desc: 'Enter the material name, SKU, quantity (kg), unit cost (SAR/kg) and reorder threshold.',
        action: 'Click "+ New Material" and fill in all fields, then save.',
    },
    {
        icon: FlaskConical,
        color: '#8b5cf6',
        title: 'Create Production Batch',
        desc: 'When manufacturing begins, start a production batch. This tracks which materials are consumed and in what quantities.',
        action: 'Go to Production → New Batch. Select product and raw materials used.',
    },
    {
        icon: Box,
        color: '#22c55e',
        title: 'Log Finished Product',
        desc: 'Once production is done, log the finished units. Set the unit cost and retail price for each batch.',
        action: 'Go to Inventory → Finished Products → Add or update product stock.',
    },
    {
        icon: ShoppingCart,
        color: '#ef4444',
        title: 'Ready for Sale',
        desc: 'Finished products are now available for orders. Stock is automatically deducted when an order is fulfilled.',
        action: 'Create orders in Sales → New Order. Select the finished product variant.',
    },
];

export default function InventorySopPanel() {
    const [open, setOpen] = useState(false);

    return (
        <div
            className="rounded-xl border overflow-hidden transition-all duration-300"
            style={{ borderColor: 'var(--primary)', background: 'var(--card)' }}
        >
            {/* Toggle Header */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:opacity-90 transition-opacity"
                style={{ background: 'var(--primary)/10' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            📋 SOP Guide — Inventory Flow
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Step-by-step guide: Raw Material → Production → Finished → Sale
                        </p>
                    </div>
                </div>
                <div style={{ color: 'var(--primary)' }}>
                    {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </button>

            {/* Flowchart Content */}
            {open && (
                <div className="p-5 border-t" style={{ borderColor: 'var(--border)' }}>
                    {/* Visual Flow */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-0 sm:gap-0 overflow-x-auto pb-2">
                        {STEPS.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <div key={i} className="flex flex-row sm:flex-col items-center sm:items-start flex-1 min-w-[160px]">
                                    {/* Step Card */}
                                    <div
                                        className="flex-1 rounded-xl p-4 border flex flex-col gap-2 w-full"
                                        style={{ borderColor: `${step.color}40`, background: `${step.color}0d` }}
                                    >
                                        {/* Step Number + Icon */}
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                                                style={{ background: step.color }}
                                            >
                                                {i + 1}
                                            </div>
                                            <Icon className="w-4 h-4" style={{ color: step.color }} />
                                        </div>
                                        {/* Title */}
                                        <p className="text-[13px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                            {step.title}
                                        </p>
                                        {/* Description */}
                                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                            {step.desc}
                                        </p>
                                        {/* Action */}
                                        <p
                                            className="text-[10px] font-semibold mt-auto pt-2 border-t leading-snug"
                                            style={{ color: step.color, borderColor: `${step.color}30` }}
                                        >
                                            → {step.action}
                                        </p>
                                    </div>

                                    {/* Arrow between steps */}
                                    {i < STEPS.length - 1 && (
                                        <div className="flex items-center justify-center px-1 py-2 sm:py-0 sm:px-0 sm:w-full sm:h-6 shrink-0">
                                            <ArrowRight
                                                className="w-4 h-4 rotate-90 sm:rotate-0 mx-auto"
                                                style={{ color: 'var(--text-muted)' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer note */}
                    <p className="text-[11px] mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
                        💡 This guide is designed for manufacturing teams. Keep it pinned for new staff onboarding.
                    </p>
                </div>
            )}
        </div>
    );
}
