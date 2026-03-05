import { getDocuments } from '@/app/actions/documents/documents';
import DocumentsVaultClient from './DocumentsVaultClient';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default async function DocumentsPage({ params, searchParams }: { params: Promise<{ businessSlug: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { businessSlug } = await params;

  const resolvedSearchParams = await searchParams;
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;
  const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined;

  const documents = await getDocuments(businessSlug, search, category);

  return (
    <PermissionGuard module="crm" action="view">
      <DocumentsVaultClient initialDocuments={documents} businessSlug={businessSlug} />
    </PermissionGuard>
  );
}
