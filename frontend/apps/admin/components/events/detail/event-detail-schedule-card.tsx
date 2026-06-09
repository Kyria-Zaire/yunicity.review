import { EventDetailCard } from "@/components/events/detail/event-detail-card";
import { EventDetailField } from "@/components/events/detail/event-detail-field";
import type { AdminLocalEventDetail } from "@yunicity/types";
import {
  eventTemporalStatus,
  eventTemporalStatusLabel,
  formatEventDate,
  formatEventDuration,
} from "@yunicity/utils";
import { Clock } from "lucide-react";

interface EventDetailScheduleCardProps {
  event: AdminLocalEventDetail;
}

export function EventDetailScheduleCard({ event }: EventDetailScheduleCardProps) {
  const temporal = eventTemporalStatus(event.starts_at, event.ends_at);

  return (
    <EventDetailCard
      title="Dates & horaires"
      subtitle="Fuseau horaire partenaire et fenêtre de l'événement"
      headerAction={
        <span className="inline-flex rounded-lg bg-yunicity-primary-soft p-2 text-yunicity-primary">
          <Clock className="h-4 w-4" aria-hidden />
        </span>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2">
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
        <EventDetailField label="Visibilité" value={event.visibility} />
      </dl>
    </EventDetailCard>
  );
}
