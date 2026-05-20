import { EventDetailScreen } from "@/components/events/event-detail-screen";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventDetailScreen eventId={id} />;
}
