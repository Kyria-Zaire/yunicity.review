import { EventDetailField } from "@/components/events/detail/event-detail-field";
import type { AdminLocalEventDetail } from "@yunicity/types";

interface EventDetailEngagementCardProps {
  event: AdminLocalEventDetail;
}

export function EventDetailEngagementCard({ event }: EventDetailEngagementCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Intérêt / engagement
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <EventDetailField
          label="Nombre d'intéressés"
          value={String(event.interest_count ?? 0)}
        />
      </dl>
      <p className="mt-4 text-sm text-stone-500">
        La liste nominative des citoyens intéressés n&apos;est pas disponible en V1 staff.
      </p>
    </section>
  );
}
