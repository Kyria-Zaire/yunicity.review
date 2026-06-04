import type { PartnerCreatorContentStatus } from "@yunicity/types";
import {
  ADMIN_CREATOR_CONTENT_STATUS_LABELS,
  ADMIN_CREATOR_CONTENT_STATUS_TONES,
  creatorContentStatusBadgeVariant,
} from "@yunicity/utils";

export function CreatorContentStatusBadge({ status }: { status: PartnerCreatorContentStatus }) {
  const variant = creatorContentStatusBadgeVariant(status);
  const tone =
    variant === "unknown"
      ? { bg: "#f5f5f4", text: "#57534e", border: "#e7e5e4" }
      : ADMIN_CREATOR_CONTENT_STATUS_TONES[variant];
  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: tone.bg,
        color: tone.text,
        borderColor: tone.border,
      }}
    >
      {ADMIN_CREATOR_CONTENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}
