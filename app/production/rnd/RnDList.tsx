'use client';

import { useState } from 'react';
import { RndProjectType } from '@/app/actions/production';
import { Badge } from '@/components/ui/badge';
import RnDDetailModal from './RnDDetailModal';

const statusColors: Record<string, string> = {
    ideation: 'bg-gray-500',
    formulation: 'bg-blue-500',
    testing: 'bg-yellow-500',
    sfda_submission: 'bg-purple-500',
    approved: 'bg-green-500',
    archived: 'bg-gray-400',
};

export function RnDList({ projects }: { projects: RndProjectType[] }) {
    const [selectedProject, setSelectedProject] = useState<RndProjectType | null>(null);

    if (projects.length === 0) {
        return (
            <div className="text-center py-12">
                <p style={{ color: 'var(--text-muted)' }}>No R&D projects yet</p>
            </div>
        );
    }

    return (
        <div>
            <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <table className="w-full">
                    <thead style={{ background: 'var(--muted)' }}>
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Cost Estimate</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Target Launch</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <tr
                                key={project.id}
                                className="border-t hover:bg-muted/50 transition-colors cursor-pointer"
                                style={{ borderColor: 'var(--border)' }}
                                onClick={() => setSelectedProject(project)}
                            >
                                <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{project.name}</td>
                                <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{project.category}</td>
                                <td className="px-4 py-3">
                                    <Badge className={`${statusColors[project.status]} text-white`}>
                                        {project.status.replace('_', ' ')}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                                    {project.costEstimate ? `SAR ${project.costEstimate.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                                    {project.targetLaunchDate ? new Date(project.targetLaunchDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <RnDDetailModal
                project={selectedProject}
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
            />
        </div>
    );
}
