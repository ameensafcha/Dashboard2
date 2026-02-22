'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    Building2, Users, Handshake, DollarSign, ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const stageLabels: Record<string, string> = {
    new_lead: 'New Lead', qualified: 'Qualified', sample_sent: 'Sample Sent',
    proposal: 'Proposal', negotiation: 'Negotiation',
};
const stageColors: Record<string, string> = {
    new_lead: 'bg-gray-500', qualified: 'bg-blue-500', sample_sent: 'bg-cyan-500',
    proposal: 'bg-amber-500', negotiation: 'bg-purple-500',
};

type CrmOverviewData = {
    kpis: { companies: number; contacts: number; activeDeals: number; pipelineValue: number };
    dealsByStage: { stage: string; count: number }[];
    recentDeals: { id: string; title: string; value: number; stage: string; updatedAt: string; company: { name: string } | null; client: { name: string } | null }[];
};

export default function CrmOverviewClient({ data }: { data: CrmOverviewData }) {
    const kpis = [
        { title: 'Companies', value: data.kpis.companies, icon: Building2, color: '#3b82f6' },
        { title: 'Contacts', value: data.kpis.contacts, icon: Users, color: '#22c55e' },
        { title: 'Active Deals', value: data.kpis.activeDeals, icon: Handshake, color: '#E8A838' },
        { title: 'Pipeline Value', value: data.kpis.pipelineValue, prefix: 'SAR ', icon: DollarSign, color: '#a855f7' },
    ];

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <PageHeader title="CRM Overview" />
                <div className="flex gap-2">
                    <Link href="/crm/companies" className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:border-[var(--primary)]" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Companies</Link>
                    <Link href="/crm/contacts" className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:border-[var(--primary)]" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Contacts</Link>
                    <Link href="/crm/pipeline" className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:border-[var(--primary)]" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Pipeline</Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.title} className="rounded-xl p-5 border transition-all hover:shadow-md" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{kpi.title}</span>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                                    <Icon className="w-4.5 h-4.5" style={{ color: kpi.color }} />
                                </div>
                            </div>
                            <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                                {(kpi as any).prefix || ''}{typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-US', { minimumFractionDigits: (kpi as any).prefix ? 2 : 0, maximumFractionDigits: 2 }) : kpi.value}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Pipeline + Recent Deals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Deals by Stage */}
                <div className="rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Deals by Stage</h2>
                    {data.dealsByStage.length === 0 ? (
                        <div className="py-6 text-center" style={{ color: 'var(--text-muted)' }}>No active deals</div>
                    ) : (
                        <div className="space-y-3">
                            {data.dealsByStage.map(s => (
                                <div key={s.stage} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${stageColors[s.stage] || 'bg-gray-500'}`} />
                                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{stageLabels[s.stage] || s.stage}</span>
                                    </div>
                                    <Badge variant="outline" className="border-[var(--border)]">{s.count}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Deals */}
                <div className="lg:col-span-2 rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Deals</h2>
                        <Link href="/crm/pipeline" className="text-xs flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                            View Pipeline <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {data.recentDeals.length === 0 ? (
                        <div className="py-6 text-center" style={{ color: 'var(--text-muted)' }}>No deals yet. Create one from the Pipeline.</div>
                    ) : (
                        <div className="space-y-0 max-h-[260px] overflow-y-auto">
                            {data.recentDeals.map((d, i) => (
                                <div key={d.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < data.recentDeals.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div className="min-w-0">
                                        <span className="text-sm font-medium block truncate" style={{ color: 'var(--text-primary)' }}>{d.title}</span>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.company?.name || d.client?.name || 'No contact'}</span>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>SAR {d.value.toLocaleString()}</span>
                                        <Badge className={`ml-2 text-white text-[10px] ${stageColors[d.stage] || 'bg-gray-500'}`}>
                                            {stageLabels[d.stage] || d.stage}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
