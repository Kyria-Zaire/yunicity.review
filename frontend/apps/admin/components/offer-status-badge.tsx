import type { PartnerOfferAdminStatus } from "@yunicity/types";
import {
  PARTNER_OFFER_STATUS_LABELS,
  PARTNER_OFFER_STATUS_TONES,
} from "@yunicity/utils";

export function OfferStatusBadge({ status }: { status: PartnerOfferAdminStatus }) {
  const tone = PARTNER_OFFER_STATUS_TONES[status];
  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: tone.bg,
        color: tone.text,
        borderColor: tone.border,
      }}
    >
      {PARTNER_OFFER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
