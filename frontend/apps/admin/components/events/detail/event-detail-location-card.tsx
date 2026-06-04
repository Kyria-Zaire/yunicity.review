import { EventDetailField } from "@/components/events/detail/event-detail-field";
import type { AdminLocalEventDetail } from "@yunicity/types";

interface EventDetailLocationCardProps {
  event: AdminLocalEventDetail;
}

export function EventDetailLocationCard({ event }: EventDetailLocationCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Lieu</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <EventDetailField label="Nom du lieu" value={event.location_name} />
        <EventDetailField label="Adresse" value={event.address?.trim() || "—"} />
        <EventDetailField label="Ville" value={event.city} />
      </dl>
      <div
        className="mt-4 rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500"
        aria-hidden
      >
        Carte — intégration géolocalisation hors périmètre V1
      </div>
    </section>
  );
}
