export type PartnerOfferValueCategory =
  | "percent_discount"
  | "free_item"
  | "loyalty_reward"
  | "exclusive_access"
  | "event_benefit"
  | "welcome_bonus";

export type PartnerOfferReadinessLevel = "ready" | "partial" | "not_ready";

export type PartnerOfferReadinessCheckSeverity = "ok" | "warning" | "error";

export interface PartnerOfferReadinessCheck {
  key: string;
  label: string;
  passed: boolean;
  severity: PartnerOfferReadinessCheckSeverity;
}

export interface PartnerOfferReadinessFields {
  readiness: PartnerOfferReadinessLevel;
  is_passport_eligible: boolean;
  is_placeholder: boolean;
  value_category: PartnerOfferValueCategory;
  value_category_label: string;
  human_description: string;
  checks: PartnerOfferReadinessCheck[];
}
