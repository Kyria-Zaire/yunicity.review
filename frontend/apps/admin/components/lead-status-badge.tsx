import type { PartnerLeadStatus } from "@yunicity/types";
import { PARTNER_LEAD_STATUS_LABELS } from "@yunicity/utils";

const STYLES: Record<PartnerLeadStatus, string> = {
  new: "bg-sky-50 text-sky-800 ring-sky-200",
  contacted: "bg-violet-50 text-violet-800 ring-violet-200",
  interested: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  meeting_scheduled: "bg-blue-50 text-blue-800 ring-blue-200",
  signed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  converted: "bg-yunicity-primary text-white ring-yunicity-primary/30",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  archived: "bg-neutral-100 text-neutral-600 ring-neutral-200",
};

export function LeadStatusBadge({ status }: { status: PartnerLeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {PARTNER_LEAD_STATUS_LABELS[status]}
    </span>
  );
}
