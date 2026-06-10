import type { AdminPassportStatus } from "@yunicity/types";
import { adminPassportStatusLabel } from "@yunicity/utils";

const TONE: Record<AdminPassportStatus, string> = {
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  suspended: "bg-amber-50 text-amber-900 ring-amber-200",
};

const DOT_TONE: Record<AdminPassportStatus, string> = {
  active: "bg-emerald-500",
  suspended: "bg-amber-500",
};

export function PassportStatusBadge({
  status,
  showDot = false,
}: {
  status: AdminPassportStatus;
  showDot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE[status]}`}
    >
      {showDot ? (
        <span className={`h-1.5 w-1.5 rounded-full ${DOT_TONE[status]}`} aria-hidden />
      ) : null}
      {adminPassportStatusLabel(status)}
    </span>
  );
}
