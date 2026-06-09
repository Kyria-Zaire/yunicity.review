import { EventDetailCard } from "@/components/events/detail/event-detail-card";
import type { AdminLocalEventDetail } from "@yunicity/types";
import {
  eventFeedSyncCopy,
  eventIsFeedDistributed,
  eventModerationStatusLabel,
} from "@yunicity/utils";
import { Rss } from "lucide-react";

interface EventDetailFeedSyncCardProps {
  event: AdminLocalEventDetail;
}

function feedDistributionHint(event: AdminLocalEventDetail): string {
  if (eventIsFeedDistributed(event)) {
    return "L'événement est éligible à la distribution feed et carte (approuvé, non annulé).";
  }
  if (event.is_cancelled) {
    return "Non distribué — événement annulé.";
  }
  if (event.moderation_status === "pending_review") {
    return "Non distribué — en attente d'approbation staff.";
  }
  if (event.moderation_status === "rejected") {
    return "Non distribué — événement refusé.";
  }
  return `Non distribué — statut ${eventModerationStatusLabel(event.moderation_status)}.`;
}

export function EventDetailFeedSyncCard({ event }: EventDetailFeedSyncCardProps) {
  const distributed = eventIsFeedDistributed(event);

  return (
    <EventDetailCard
      title="Synchronisation feed"
      subtitle="Distribution locale (feed / carte)"
      headerAction={
        <span className="inline-flex rounded-lg bg-yunicity-primary-soft p-2 text-yunicity-primary">
          <Rss className="h-4 w-4" aria-hidden />
        </span>
      }
    >
      <p className="text-sm text-yunicity-ink">{feedDistributionHint(event)}</p>
      {distributed ? (
        <p className="mt-2 text-xs text-yunicity-ink-muted">{eventFeedSyncCopy}</p>
      ) : null}
      <p className="mt-3 rounded-lg border border-dashed border-yunicity-border bg-yunicity-surface px-3 py-2 text-xs text-yunicity-ink-muted">
        Synchronisation feed non exposée dans cette vue (horodatage et statut technique
        indisponibles).
      </p>
    </EventDetailCard>
  );
}
