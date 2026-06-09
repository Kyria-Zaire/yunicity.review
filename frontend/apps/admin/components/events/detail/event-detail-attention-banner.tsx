import type { AdminLocalEventDetail } from "@yunicity/types";
import { eventCancelledBadgeLabel, eventModerationStatusLabel } from "@yunicity/utils";
import { AlertTriangle, Ban, Clock } from "lucide-react";

interface EventDetailAttentionBannerProps {
  event: AdminLocalEventDetail;
}

type BannerTone = "amber" | "rose" | "stone";

function bannerStyles(tone: BannerTone): string {
  switch (tone) {
    case "rose":
      return "border-rose-200 bg-rose-50 text-rose-950";
    case "stone":
      return "border-stone-200 bg-stone-50 text-stone-800";
    default:
      return "border-amber-200 bg-amber-50 text-amber-950";
  }
}

export function EventDetailAttentionBanner({ event }: EventDetailAttentionBannerProps) {
  if (event.is_cancelled) {
    return (
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${bannerStyles("stone")}`}
        role="status"
      >
        <Ban className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{eventCancelledBadgeLabel}</p>
          <p className="mt-0.5 text-stone-700">
            L&apos;événement n&apos;est plus visible côté citoyen.
            {event.cancelled_at ? ` Annulé le ${new Date(event.cancelled_at).toLocaleDateString("fr-FR")}.` : null}
          </p>
        </div>
      </div>
    );
  }

  if (event.moderation_status === "pending_review") {
    return (
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${bannerStyles("amber")}`}
        role="status"
      >
        <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{eventModerationStatusLabel("pending_review")}</p>
          <p className="mt-0.5">Cet événement attend une décision de modération staff.</p>
        </div>
      </div>
    );
  }

  if (event.moderation_status === "rejected") {
    return (
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${bannerStyles("rose")}`}
        role="status"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Événement refusé</p>
          <p className="mt-0.5">
            {event.rejection_reason?.trim()
              ? `Motif : ${event.rejection_reason}`
              : "La modération a refusé cette publication."}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
