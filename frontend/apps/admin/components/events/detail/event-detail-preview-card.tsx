import { EventDetailCard } from "@/components/events/detail/event-detail-card";
import { EventDetailField } from "@/components/events/detail/event-detail-field";
import type { AdminLocalEventDetail } from "@yunicity/types";
import { formatEventDate } from "@yunicity/utils";
import { ImageIcon } from "lucide-react";

interface EventDetailPreviewCardProps {
  event: AdminLocalEventDetail;
}

function descriptionExcerpt(description: string | null): string {
  const trimmed = description?.trim();
  if (!trimmed) {
    return "Aucune description fournie.";
  }
  if (trimmed.length <= 280) {
    return trimmed;
  }
  return `${trimmed.slice(0, 277)}…`;
}

export function EventDetailPreviewCard({ event }: EventDetailPreviewCardProps) {
  const locationLine = [event.location_name, event.address?.trim()].filter(Boolean).join(" — ");

  return (
    <EventDetailCard
      title="Aperçu public"
      subtitle="Ce que les citoyens verront une fois l'événement visible"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-lg border border-dashed border-yunicity-border bg-yunicity-surface sm:w-40">
          <div className="text-center">
            <ImageIcon className="mx-auto h-6 w-6 text-yunicity-ink-muted" aria-hidden />
            <p className="mt-2 text-xs text-yunicity-ink-muted">Aucune image de couverture</p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-yunicity-ink">{event.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-yunicity-ink-muted">
            {descriptionExcerpt(event.description)}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <EventDetailField label="Date" value={formatEventDate(event.starts_at)} />
            <EventDetailField label="Lieu" value={locationLine || "—"} />
          </dl>
        </div>
      </div>
    </EventDetailCard>
  );
}
