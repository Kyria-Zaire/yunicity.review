import { cn } from "@/lib/utils";
import type { AdminActivityAlertSeverity, AdminActivityFeedSeverity } from "@yunicity/types";

const ALERT_STYLES: Record<AdminActivityAlertSeverity, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-rose-200 bg-rose-50 text-rose-800",
};

const FEED_STYLES: Record<AdminActivityFeedSeverity, string> = {
  info: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-rose-200 bg-rose-50 text-rose-800",
};

interface ActivitySeverityBadgeProps {
  label: string;
  variant: "alert" | "feed";
  severity: AdminActivityAlertSeverity | AdminActivityFeedSeverity;
  className?: string;
}

export function ActivitySeverityBadge({
  label,
  variant,
  severity,
  className,
}: ActivitySeverityBadgeProps) {
  const styles = variant === "alert" ? ALERT_STYLES : FEED_STYLES;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[severity as keyof typeof styles],
        className,
      )}
    >
      {label}
    </span>
  );
}
