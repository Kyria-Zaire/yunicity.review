import type { AdminReportReason, AdminReportStatus } from "@yunicity/types";
import { reportReasonLabel, reportStatusLabel } from "@yunicity/utils";

const STATUS_TONES: Record<
  AdminReportStatus,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  reviewed: { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
  dismissed: { bg: "#f5f5f4", text: "#57534e", border: "#e7e5e4" },
  action_taken: { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
};

const REASON_TONES: Record<AdminReportReason, { bg: string; text: string; border: string }> = {
  spam: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
  inappropriate: { bg: "#ffedd5", text: "#9a3412", border: "#fed7aa" },
  other: { bg: "#f5f5f4", text: "#57534e", border: "#e7e5e4" },
};

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: { bg: string; text: string; border: string };
}) {
  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: tone.bg,
        color: tone.text,
        borderColor: tone.border,
      }}
    >
      {label}
    </span>
  );
}

export function ModerationReportStatusBadge({ status }: { status: AdminReportStatus | string }) {
  const tone =
    status in STATUS_TONES
      ? STATUS_TONES[status as AdminReportStatus]
      : { bg: "#f5f5f4", text: "#57534e", border: "#e7e5e4" };
  return <Badge label={reportStatusLabel(status)} tone={tone} />;
}

export function ModerationReportReasonBadge({ reason }: { reason: AdminReportReason | string }) {
  const tone =
    reason in REASON_TONES
      ? REASON_TONES[reason as AdminReportReason]
      : { bg: "#f5f5f4", text: "#57534e", border: "#e7e5e4" };
  return <Badge label={reportReasonLabel(reason)} tone={tone} />;
}
