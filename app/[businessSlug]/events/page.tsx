import { getEventsOverview, getEvents } from '@/app/actions/events/events';
import EventsOverviewClient from './EventsOverviewClient';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default async function EventsPage({ params, searchParams }: { params: Promise<{ businessSlug: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { businessSlug } = await params;

  const resolvedSearchParams = await searchParams;
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;
  const status = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined;
  const type = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type : undefined;

  const data = await getEventsOverview(businessSlug);
  const events = await getEvents(businessSlug, search, status, type);

  return (
    <PermissionGuard module="events" action="view">
      <EventsOverviewClient data={data} initialEvents={events} businessSlug={businessSlug} />
    </PermissionGuard>
  );
}
