import type { AdminPassportStatus } from "@yunicity/types";
import { adminPassportStatusLabel } from "@yunicity/utils";

const TONE: Record<AdminPassportStatus, string> = {
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  suspended: "bg-amber-50 text-amber-900 ring-amber-200",
};

export function PassportStatusBadge({ status }: { status: AdminPassportStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE[status]}`}
    >
      {adminPassportStatusLabel(status)}
    </span>
  );
}
