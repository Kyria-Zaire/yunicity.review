/** Local event readiness — RF-03A */

export type EventReadinessLevel = "ready" | "partial" | "not_ready";
export type EventReadinessCheckSeverity = "ok" | "warning" | "error";
export type EventContentClassification = "real" | "partial" | "placeholder";
export type TerritoryEventHealthLevel = "healthy" | "warning" | "critical";

export interface EventReadinessCheck {
  key: string;
  label: string;
  passed: boolean;
  severity: EventReadinessCheckSeverity;
}

export interface EventReadinessFields {
  readiness: EventReadinessLevel;
  classification: EventContentClassification;
  contributes_to_territory: boolean;
  territory_contribution_label: string;
  checks: EventReadinessCheck[];
}

export interface TerritoryEventHealthFields {
  status: TerritoryEventHealthLevel;
  upcoming_published_count: number;
  label: string;
  signal_emoji: string;
}
