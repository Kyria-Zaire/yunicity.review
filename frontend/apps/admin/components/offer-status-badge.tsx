import type { PartnerOfferAdminStatus } from "@yunicity/types";
import { offerStatusBadgeTone, offerStatusLabel } from "@yunicity/utils";

export function OfferStatusBadge({ status }: { status: PartnerOfferAdminStatus }) {
  const tone = offerStatusBadgeTone(status);
  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: tone.bg,
        color: tone.text,
        borderColor: tone.border,
      }}
    >
      {offerStatusLabel(status)}
    </span>
  );
}
