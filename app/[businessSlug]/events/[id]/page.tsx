import { getEventById } from '@/app/actions/events/events';
import EventDetailClient from './EventDetailClient';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { notFound } from 'next/navigation';

export default async function EventPage({ params }: { params: Promise<{ businessSlug: string, id: string }> }) {
    const { businessSlug, id } = await params;
    const event = await getEventById(id, businessSlug);

    if (!event) {
        notFound();
    }

    return (
        <PermissionGuard module="events" action="view">
            <EventDetailClient event={event} businessSlug={businessSlug} />
        </PermissionGuard>
    );
}
