import { Suspense } from 'react';
import { getRnDProjects } from '@/app/actions/production';
import NewRnDModal from './NewRnDModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { RnDList } from './RnDList';

export const metadata = {
  title: 'R&D Projects - Safcha Dashboard',
  description: 'Research and Development projects',
};

export default async function RnDPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const projects = await getRnDProjects(params.search);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader title="R&D Projects" />
        <NewRnDModal />
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <RnDList projects={projects} />
      </Suspense>
    </div>
  );
}
