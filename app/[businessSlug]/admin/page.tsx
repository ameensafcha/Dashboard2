import Link from 'next/link';
import { Users, Shield, History, ArrowRight } from 'lucide-react';


export default async function AdminPage({
    params,
}: {
    params: Promise<{ businessSlug: string }>;
}) {
    const { businessSlug } = await params;

    const sections = [
        {
            title: 'Team Management',
            description: 'Manage users, roles, and business access.',
            href: `/${businessSlug}/admin/team`,
            icon: Users,
            color: 'bg-blue-500/10 text-blue-500'
        },
        {
            title: 'Roles & Permissions',
            description: 'Define roles and handle granular permissions.',
            href: `/${businessSlug}/admin/roles`,
            icon: Shield,
            color: 'bg-amber-500/10 text-amber-500'
        },
        {
            title: 'Audit Logs',
            description: 'Monitor all system activity and security events.',
            href: `/${businessSlug}/admin/audit`,
            icon: History,
            color: 'bg-purple-500/10 text-purple-500'
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
                <p className="text-muted-foreground mt-2">
                    Select a management area below to get started.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sections.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        className="group relative bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl hover:border-[var(--accent-gold)]/50 transition-all hover:shadow-lg"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${section.color}`}>
                            <section.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            {section.title}
                            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {section.description}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
