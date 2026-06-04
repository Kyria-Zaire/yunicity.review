import { EventDetailField } from "@/components/events/detail/event-detail-field";
import type { AdminLocalEventDetail } from "@yunicity/types";
import {
  eventTemporalStatus,
  eventTemporalStatusLabel,
  formatEventDate,
  formatEventDuration,
} from "@yunicity/utils";

interface EventDetailScheduleCardProps {
  event: AdminLocalEventDetail;
}

export function EventDetailScheduleCard({ event }: EventDetailScheduleCardProps) {
  const temporal = eventTemporalStatus(event.starts_at, event.ends_at);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Dates</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <EventDetailField label="Début" value={formatEventDate(event.starts_at)} />
        <EventDetailField label="Fin" value={formatEventDate(event.ends_at)} />
        <EventDetailField
          label="Durée estimée"
          value={formatEventDuration(event.starts_at, event.ends_at)}
        />
        <EventDetailField
          label="Statut temporel"
          value={eventTemporalStatusLabel(temporal)}
        />
        <EventDetailField label="Fuseau horaire" value={event.timezone} />
      </dl>
    </section>
  );
}
