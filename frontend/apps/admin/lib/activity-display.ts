import type {
  AdminActivityAlertSeverity,
  AdminActivityFeedSeverity,
  AdminActivityHealthStatus,
} from "@yunicity/types";

export function formatActivityGeneratedAt(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatActivityRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  return formatActivityGeneratedAt(iso);
}

const ALERT_SEVERITY_LABELS: Record<AdminActivityAlertSeverity, string> = {
  healthy: "OK",
  warning: "À surveiller",
  critical: "Action requise",
};

const FEED_SEVERITY_LABELS: Record<AdminActivityFeedSeverity, string> = {
  info: "Info",
  success: "Succès",
  warning: "Attention",
  critical: "Critique",
};

const HEALTH_STATUS_LABELS: Record<AdminActivityHealthStatus, string> = {
  healthy: "Opérationnel",
  degraded: "Dégradé",
  critical: "Critique",
};

export function activityAlertSeverityLabel(severity: AdminActivityAlertSeverity): string {
  return ALERT_SEVERITY_LABELS[severity];
}

export function activityFeedSeverityLabel(severity: AdminActivityFeedSeverity): string {
  return FEED_SEVERITY_LABELS[severity];
}

export function activityHealthStatusLabel(status: AdminActivityHealthStatus): string {
  return HEALTH_STATUS_LABELS[status];
}

export const ACTIVITY_CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "Toutes" },
  { value: "moderation", label: "Modération" },
  { value: "report", label: "Signalements" },
  { value: "offer", label: "Offres" },
  { value: "event", label: "Événements" },
  { value: "creator", label: "Créateurs" },
  { value: "partner", label: "Partenaires" },
  { value: "passport", label: "Passport" },
  { value: "staff", label: "Staff" },
] as const;
