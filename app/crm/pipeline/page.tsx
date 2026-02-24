import { Metadata } from 'next';
import PipelineClient from './PipelineClient';

export const metadata: Metadata = {
    title: 'Deals Pipeline | Safcha',
    description: 'Track and manage your sales CRM pipeline',
};

export const dynamic = 'force-dynamic';

export default function PipelinePage() {
    return <PipelineClient />;
}
