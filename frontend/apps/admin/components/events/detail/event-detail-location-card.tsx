import { EventDetailCard } from "@/components/events/detail/event-detail-card";
import { EventDetailField } from "@/components/events/detail/event-detail-field";
import type { AdminLocalEventDetail } from "@yunicity/types";
import { MapPin } from "lucide-react";

interface EventDetailLocationCardProps {
  event: AdminLocalEventDetail;
}

export function EventDetailLocationCard({ event }: EventDetailLocationCardProps) {
  return (
    <EventDetailCard
      title="Lieu"
      subtitle="Adresse affichée aux citoyens"
      headerAction={
        <span className="inline-flex rounded-lg bg-orange-50 p-2 text-orange-700">
          <MapPin className="h-4 w-4" aria-hidden />
        </span>
      }
    >
      <dl className="grid gap-4">
        <EventDetailField label="Nom du lieu" value={event.location_name} />
        <EventDetailField label="Adresse" value={event.address?.trim() || "—"} />
        <EventDetailField label="Ville" value={event.city} />
      </dl>
      <div className="mt-4 rounded-lg border border-dashed border-yunicity-border bg-yunicity-surface px-4 py-6 text-center">
        <MapPin className="mx-auto h-5 w-5 text-yunicity-ink-muted" aria-hidden />
        <p className="mt-2 text-xs text-yunicity-ink-muted">
          Carte interactive — géolocalisation disponible côté citoyen après publication.
        </p>
      </div>
    </EventDetailCard>
  );
}
