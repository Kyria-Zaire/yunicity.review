/** Quick Capture prospect helpers (LEADS-V3-01). */

import type { OrganizationType, PartnerLeadSource } from "@yunicity/types";

import { PARTNER_LEAD_SOURCE_LABELS } from "./domain-labels";

export const PARTNER_LEAD_QUICK_CAPTURE_DEFAULT_SOURCE: PartnerLeadSource =
  "physical_prospecting";

export const PARTNER_LEAD_QUICK_CAPTURE_DEFAULT_TYPE: OrganizationType = "commerce";

export const PARTNER_LEAD_QUICK_CAPTURE_TYPE_OPTIONS: {
  value: OrganizationType;
  label: string;
}[] = [
  { value: "commerce", label: "Commerce" },
  { value: "association", label: "Association" },
  { value: "other", label: "Lieu" },
  { value: "public_agency", label: "Organisation" },
];

export const PARTNER_LEAD_QUICK_CAPTURE_SOURCE_VALUES = [
  "physical_prospecting",
  "event",
  "instagram",
  "referral",
  "landing_page",
  "manual",
] as const satisfies readonly PartnerLeadSource[];

export type PartnerLeadQuickCaptureSource =
  (typeof PARTNER_LEAD_QUICK_CAPTURE_SOURCE_VALUES)[number];

export function partnerLeadQuickCaptureSourceOptions(): {
  value: PartnerLeadQuickCaptureSource;
  label: string;
}[] {
  return PARTNER_LEAD_QUICK_CAPTURE_SOURCE_VALUES.map((value) => ({
    value,
    label: PARTNER_LEAD_SOURCE_LABELS[value],
  }));
}

export const PARTNER_LEAD_QUICK_CAPTURE_SUCCESS_MESSAGE =
  "Prospect ajouté au pipeline.";

export const PARTNER_LEAD_QUICK_CAPTURE_ERROR_MESSAGE =
  "Impossible d'ajouter ce prospect. Réessayez.";

export function partnerLeadQuickCapturePartialResetFields(): {
  name: string;
  phone: string;
  email: string;
  notes: string;
} {
  return { name: "", phone: "", email: "", notes: "" };
}
