import { EventDetailCard } from "@/components/events/detail/event-detail-card";
import type { AdminLocalEventDetail } from "@yunicity/types";
import {
  eventIsPubliclyVisible,
  eventModerationStatusLabel,
  eventPublicExposureCopy,
  eventVisibilityLabel,
} from "@yunicity/utils";
import { Eye, EyeOff } from "lucide-react";

interface EventDetailPublicExposureCardProps {
  event: AdminLocalEventDetail;
}

function publicExposureReason(event: AdminLocalEventDetail): string {
  if (event.is_cancelled) {
    return "Non visible car l'événement est annulé.";
  }
  if (event.moderation_status === "pending_review") {
    return "Non visible car en attente de validation.";
  }
  if (event.moderation_status === "rejected") {
    return "Non visible car refusé par la modération.";
  }
  if (event.moderation_status === "approved") {
    return "Visible car approuvé et non annulé.";
  }
  return `Visibilité selon le statut : ${eventModerationStatusLabel(event.moderation_status)}.`;
}

export function EventDetailPublicExposureCard({ event }: EventDetailPublicExposureCardProps) {
  const visible = eventIsPubliclyVisible(event);
  const Icon = visible ? Eye : EyeOff;

  return (
    <EventDetailCard
      title="Exposition publique"
      subtitle="Présence côté web citoyen et feed local"
      headerAction={
        <span
          className={`inline-flex rounded-lg p-2 ${
            visible ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      }
    >
      <p className="text-sm font-medium text-yunicity-ink">
        {visible ? "Événement visible publiquement" : "Événement non visible publiquement"}
      </p>
      <p className="mt-1 text-sm text-yunicity-ink-muted">{publicExposureReason(event)}</p>
      <dl className="mt-3 grid gap-2 text-xs text-yunicity-ink-muted">
        <div className="flex justify-between gap-2 border-t border-yunicity-border pt-2">
          <dt>Visibilité configurée</dt>
          <dd className="font-medium text-yunicity-ink">{eventVisibilityLabel(event.visibility)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Modération</dt>
          <dd className="font-medium text-yunicity-ink">
            {eventModerationStatusLabel(event.moderation_status)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-yunicity-ink-muted">{eventPublicExposureCopy}</p>
    </EventDetailCard>
  );
}
