import { EventDetailField } from "@/components/events/detail/event-detail-field";
import { EventModerationStatusBadge } from "@/components/events/event-moderation-status-badge";
import type { AdminLocalEventDetail } from "@yunicity/types";
import { eventModerationStatusLabel, eventVisibilityLabel, formatEventDate } from "@yunicity/utils";

interface EventDetailIdentityCardProps {
  event: AdminLocalEventDetail;
}

export function EventDetailIdentityCard({ event }: EventDetailIdentityCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Identité événement
        </h2>
        <EventModerationStatusBadge
          status={event.moderation_status}
          isCancelled={event.is_cancelled}
        />
      </div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <EventDetailField label="ID" value={event.id} />
        <EventDetailField label="Titre" value={event.title} />
        <EventDetailField label="Description" value={event.description?.trim() || "—"} />
        <EventDetailField label="Ville" value={event.city} />
        <EventDetailField label="Visibilité" value={eventVisibilityLabel(event.visibility)} />
        <EventDetailField
          label="Modération"
          value={eventModerationStatusLabel(event.moderation_status)}
        />
        <EventDetailField label="Annulé" value={event.is_cancelled ? "Oui" : "Non"} />
        <EventDetailField label="Créé le" value={formatEventDate(event.created_at)} />
        <EventDetailField label="Mis à jour le" value={formatEventDate(event.updated_at)} />
      </dl>
    </section>
  );
}
