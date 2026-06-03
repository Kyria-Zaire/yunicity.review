import type { VerificationStatus } from "@yunicity/types";

/** Mirrors backend ALLOWED_VERIFICATION_TRANSITIONS for staff UI. */
export const ORGANIZATION_REVIEW_TRANSITIONS: Record<
  VerificationStatus,
  readonly VerificationStatus[]
> = {
  pending: ["under_review", "verified", "rejected"],
  under_review: ["verified", "rejected", "suspended"],
  verified: ["suspended"],
  rejected: ["pending", "under_review"],
  suspended: ["verified", "under_review"],
};

export type OrganizationReviewAction = VerificationStatus;

export const ORGANIZATION_REVIEW_ACTION_LABELS: Record<OrganizationReviewAction, string> = {
  pending: "Remettre en attente",
  under_review: "Mettre en revue",
  verified: "Vérifier",
  rejected: "Refuser",
  suspended: "Suspendre",
};

export function allowedOrganizationReviewActions(
  current: VerificationStatus,
): OrganizationReviewAction[] {
  return [...ORGANIZATION_REVIEW_TRANSITIONS[current]];
}

export function canOrganizationReviewAction(
  current: VerificationStatus,
  action: OrganizationReviewAction,
): boolean {
  return ORGANIZATION_REVIEW_TRANSITIONS[current].includes(action);
}

export const ADMIN_ORGANIZATION_STATUS_FILTER_OPTIONS: {
  value: "" | VerificationStatus;
  label: string;
}[] = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "under_review", label: "En revue" },
  { value: "verified", label: "Vérifiées" },
  { value: "rejected", label: "Refusées" },
  { value: "suspended", label: "Suspendues" },
];

export const ORGANIZATION_VISIBILITY_LABELS: Record<string, string> = {
  private: "Privée",
  public: "Publique",
  unlisted: "Non listée",
};
