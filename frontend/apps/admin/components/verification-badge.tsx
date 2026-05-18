import type { VerificationStatus } from "@yunicity/types";
import { VERIFICATION_STATUS_LABELS } from "@yunicity/utils";

const STYLES: Record<VerificationStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  under_review: "bg-blue-50 text-blue-800 ring-blue-200",
  verified: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  suspended: "bg-neutral-100 text-neutral-600 ring-neutral-200",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {VERIFICATION_STATUS_LABELS[status]}
    </span>
  );
}
