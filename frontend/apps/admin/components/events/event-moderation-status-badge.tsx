import type { AdminEventModerationStatus } from "@yunicity/types";
import { eventCancelledBadgeLabel, eventModerationStatusLabel } from "@yunicity/utils";

const TONES: Record<AdminEventModerationStatus, { bg: string; text: string; border: string }> = {
  pending_review: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  approved: { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
  rejected: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
};

interface EventModerationStatusBadgeProps {
  status: string;
  isCancelled?: boolean;
}

export function EventModerationStatusBadge({ status, isCancelled }: EventModerationStatusBadgeProps) {
  const tone =
    status in TONES
      ? TONES[status as AdminEventModerationStatus]
      : { bg: "#f5f5f4", text: "#57534e", border: "#e7e5e4" };

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: tone.bg,
          color: tone.text,
          borderColor: tone.border,
        }}
      >
        {eventModerationStatusLabel(status)}
      </span>
      {isCancelled ? (
        <span className="inline-flex rounded-full border border-stone-300 bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
          {eventCancelledBadgeLabel}
        </span>
      ) : null}
    </span>
  );
}
