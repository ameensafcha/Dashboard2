'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Package, Target, Activity, CheckCircle2, ChevronLeft, ChevronRight, Star, TrendingUp, FileText } from 'lucide-react';
import QCForm from './qc-form';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ProductionBatchWithProduct } from '@/app/actions/production';

const batchStatusColors: Record<string, string> = {
    planned: 'bg-blue-500',
    in_progress: 'bg-indigo-500',
    quality_check: 'bg-purple-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
};

export function BatchDetailsClient({ batch }: { batch: ProductionBatchWithProduct }) {
    const { t, isRTL } = useTranslation();
    const isCompletedOrQC = batch.status === 'completed' || batch.status === 'quality_check' || batch.status === 'failed';

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <Link
                    href="/production/batches"
                    className={cn(
                        "flex items-center text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[#E8A838] mb-6 transition-all group",
                        isRTL ? "flex-row-reverse" : "flex-row"
                    )}
                >
                    {isRTL ? <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" /> : <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />}
                    {t.viewAll} {t.batches}
                </Link>
                <div className={cn("flex flex-col sm:flex-row justify-between items-start gap-4", isRTL ? "sm:flex-row-reverse" : "")}>
                    <div className="space-y-1">
                        <PageHeader title={`${t.batchNo}: ${batch.batchNumber}`} />
                        <div className={cn("flex items-center gap-3 text-sm text-[var(--text-secondary)]", isRTL ? "flex-row-reverse" : "")}>
                            <Package className="w-4 h-4" />
                            <span className="font-semibold text-[var(--text-primary)]">{batch.product?.name || 'N/A'}</span>
                            {batch.product?.size && (
                                <span className="text-[10px] bg-[var(--muted)] px-2 py-0.5 rounded-md border border-[var(--border)] font-bold uppercase tracking-tight">
                                    {batch.product.size} {batch.product.unit || 'gm'}
                                </span>
                            )}
                        </div>
                    </div>
                    <Badge className={cn(
                        "px-4 py-1.5 text-[11px] font-black uppercase tracking-widest border-0 shadow-lg text-white rounded-full",
                        batchStatusColors[batch.status] || 'bg-gray-500'
                    )}>
                        {batch.status.replace('_', ' ')}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Batch Info Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden p-8 space-y-6 transition-all hover:shadow-md">
                        <h3 className={cn("text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] flex items-center gap-2 pb-4 border-b border-[var(--border)]", isRTL ? "flex-row-reverse" : "")}>
                            <Activity className="w-4 h-4 text-[#E8A838]" />
                            {t.coreInformation}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                            <InfoItem icon={User} label={t.producedBy} value={batch.producedBy || '-'} />
                            <InfoItem icon={Target} label={t.targetQtyKg} value={`${batch.targetQty} kg`} highlight />
                            <InfoItem icon={Activity} label={t.actualQtyKg} value={batch.actualQty ? `${batch.actualQty} kg` : '-'} color="text-green-500" />
                            <InfoItem
                                icon={TrendingUpIcon}
                                label={isRTL ? "كفاءة الإنتاج (Yield)" : "Production Yield %"}
                                value={batch.yieldPercent ? `${batch.yieldPercent.toFixed(1)}%` : '-'}
                                color={batch.yieldPercent && batch.yieldPercent >= 95 ? "text-green-500" : ""}
                                highlight
                            />
                            <InfoItem icon={StarIcon} label={t.qualityScore} value={batch.qualityScore ? `${batch.qualityScore} / 10` : '-'} />
                            <InfoItem icon={Calendar} label={t.startDate} value={new Date(batch.startDate).toLocaleDateString()} />
                            <InfoItem icon={Calendar} label={t.endDate} value={batch.endDate ? new Date(batch.endDate).toLocaleDateString() : 'Ongoing'} />
                        </div>

                        {batch.notes && (
                            <div className="mt-8 p-5 bg-[var(--muted)]/30 rounded-xl border border-[var(--border)] space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                                    <FileTextIcon className="w-3 h-3" />
                                    {t.notes}
                                </Label>
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed italic">&quot;{batch.notes}&quot;</p>
                            </div>
                        )}
                    </div>

                    {/* QC Section */}
                    {batch.qualityChecks && batch.qualityChecks.length > 0 ? (
                        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-8 space-y-6 transition-all hover:shadow-md">
                            <h3 className={cn("text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] flex items-center gap-2 pb-4 border-b border-[var(--border)]", isRTL ? "flex-row-reverse" : "")}>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                {t.qualityAuditLog}
                            </h3>
                            <div className="space-y-6">
                                {batch.qualityChecks.map((qc) => (
                                    <div key={qc.id} className="border border-[var(--border)] rounded-2xl p-6 bg-[var(--muted)]/20 space-y-6 group hover:border-[#E8A838]/30 transition-all">
                                        <div className={cn("flex justify-between items-start", isRTL ? "flex-row-reverse text-right" : "")}>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{new Date(qc.checkedAt).toLocaleString()}</span>
                                                <h4 className="text-xl font-black text-[var(--text-primary)]">{t.qualityScore}: {qc.overallScore} <span className="text-sm font-normal text-[var(--text-secondary)]">/ 10</span></h4>
                                            </div>
                                            <Badge className={cn(
                                                "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-0 shadow-sm text-white",
                                                qc.passed ? 'bg-green-500' : 'bg-red-500'
                                            )}>
                                                {qc.passed ? t.passed : t.failedResult}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-[var(--border)]/50">
                                            <QCStat label="Visual" status={qc.visualInspection} />
                                            <QCStat label="Weight" status={qc.weightVerification} />
                                            <QCStat label="Taste" status={qc.tasteTest} />
                                            <QCStat label="SFDA" status={qc.sfdaCompliance} />
                                        </div>
                                        {qc.notes && (
                                            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] border-dashed">
                                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{qc.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        !isCompletedOrQC && (
                            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-md overflow-hidden">
                                <QCForm batchId={batch.id} />
                            </div>
                        )
                    )}
                </div>

                {/* Raw Materials Sidebar */}
                <div className="space-y-6">
                    <div className="bg-[#1A1A1A] text-white rounded-2xl p-6 shadow-xl border border-white/5 space-y-6 hover:translate-y-[-4px] transition-all duration-300">
                        <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] text-[#E8A838] flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                            <Package className="w-4 h-4" />
                            {t.materialsBreakdown}
                        </h3>
                        {batch.batchItems && batch.batchItems.length > 0 ? (
                            <ul className="space-y-4">
                                {batch.batchItems.map((item) => (
                                    <li key={item.id} className={cn("flex justify-between items-center group/item", isRTL ? "flex-row-reverse" : "")}>
                                        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#E8A838]/50 group-hover/item:bg-[#E8A838] transition-all" />
                                            <span className="text-sm font-medium text-gray-300 group-hover/item:text-white transition-colors">{item.materialName}</span>
                                        </div>
                                        <span className="font-mono text-sm font-bold text-[#E8A838]">{item.quantityUsed} kg</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="py-6 text-center space-y-3">
                                <div className="p-3 rounded-full bg-white/5 w-fit mx-auto">
                                    <Activity className="w-5 h-5 text-white/30" />
                                </div>
                                <p className="text-xs text-white/40 italic">{t.noMaterialsFound}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ icon: Icon, label, value, highlight, color }: { icon: any, label: string, value: string | null, highlight?: boolean, color?: string }) {
    const { isRTL } = useTranslation();
    return (
        <div className={cn("space-y-1.5 group", isRTL ? "text-right" : "")}>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
                <Icon className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-[#E8A838] transition-colors" />
                {label}
            </p>
            <p className={cn(
                "font-black text-lg transition-all",
                highlight ? "text-[#E8A838] scale-105 origin-left" : "text-[var(--text-primary)]",
                color || ""
            )}>{value}</p>
        </div>
    );
}

function QCStat({ label, status }: any) {
    const passed = status === 'pass';
    return (
        <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-tighter">{label}</span>
            <span className={cn(
                "text-sm font-black tracking-widest",
                passed ? 'text-green-500' : 'text-red-500'
            )}>
                {passed ? 'PASS' : 'FAIL'}
            </span>
        </div>
    );
}

// Simple icons for info items
function StarIcon(props: any) { return <Star {...props} /> }
function TrendingUpIcon(props: any) { return <TrendingUp {...props} /> }
function FileTextIcon(props: any) { return <FileText {...props} /> }
