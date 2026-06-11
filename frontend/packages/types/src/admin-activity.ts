export type AdminActivityAlertSeverity = "healthy" | "warning" | "critical";
export type AdminActivityHealthStatus = "healthy" | "degraded" | "critical";
export type AdminActivityFeedSeverity = "info" | "success" | "warning" | "critical";
export type AdminActivityCheckStatus = "ok" | "error" | "unknown";

export type AdminActivityFeedCategory =
  | "partner"
  | "passport"
  | "offer"
  | "event"
  | "creator"
  | "moderation"
  | "staff"
  | "system"
  | "report";

export type AdminActivityFilterCategory =
  | "all"
  | AdminActivityFeedCategory;

export interface AdminActivityHealth {
  status: AdminActivityHealthStatus;
  database: AdminActivityCheckStatus;
  redis: AdminActivityCheckStatus;
}

export interface AdminActivityAttentionSummary {
  critical: number;
  warning: number;
  total: number;
  healthy: boolean;
}

export interface AdminActivityAlert {
  id: string;
  label: string;
  description: string;
  count: number;
  severity: AdminActivityAlertSeverity;
  href: string;
  category: "moderation" | "partners" | "system";
}

export interface AdminActivitySectionSummary {
  label: string;
  count: number;
  severity: AdminActivityAlertSeverity;
}

export interface AdminActivitySections {
  moderation: AdminActivitySectionSummary;
  partners: AdminActivitySectionSummary;
  system: AdminActivitySectionSummary;
}

export interface AdminActivitySummary {
  generated_at: string;
  read_only: boolean;
  health: AdminActivityHealth;
  attention: AdminActivityAttentionSummary;
  alerts: AdminActivityAlert[];
  sections: AdminActivitySections;
}

export interface AdminActivityFeedItem {
  id: string;
  category: AdminActivityFeedCategory;
  action: string;
  title: string;
  description: string;
  actor_label: string;
  target_label: string;
  target_id: string;
  href: string;
  severity: AdminActivityFeedSeverity;
  created_at: string;
}

export interface AdminActivityFeed {
  generated_at: string;
  items: AdminActivityFeedItem[];
  next_cursor: string | null;
}

export interface AdminActivityFeedParams {
  limit?: number;
  cursor?: string | null;
  category?: AdminActivityFilterCategory;
}
