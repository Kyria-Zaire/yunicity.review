/**
 * Fixtures FICTIVES partagées par les tests de la page partenaire de création d'offre
 * (PARTNER-OFFER-CREATE-DESKTOP-LAYOUT-01).
 */
import type { PassportOfferCreateContextValue } from "@/hooks/use-passport-offer-create-context";
import type { PartnerPortalContextValue } from "@/hooks/use-partner-portal-context";
import type { OrganizationMeItem } from "@yunicity/types";
import { createEmptyPassportOfferCreateDraft } from "@yunicity/utils";

export const OFFER_CREATE_TEST_ORGANIZATION: OrganizationMeItem = {
  id: "org-fictive",
  slug: "cafe-fictif",
  name: "Café Fictif",
  type: "commerce",
  city: "Reims",
  verification_status: "verified",
  visibility: "public",
  onboarding_completed: true,
  member_role: "owner",
  member_status: "active",
};

export function buildOfferCreateTestContext(
  overrides: { loading?: boolean } = {},
): PassportOfferCreateContextValue {
  const organization = OFFER_CREATE_TEST_ORGANIZATION;
  const portal: PartnerPortalContextValue = {
    organizations: [organization],
    manageableOrganizations: [organization],
    organization,
    partner: null,
    offers: [],
    publicOffers: [],
    events: [],
    creatorContents: [],
    isLoading: false,
    error: null,
    canManage: true,
    hasActivePartnerSpace: false,
    reload: async () => {},
    setOrganizationId: () => {},
  };
  return {
    ctx: portal,
    draft: createEmptyPassportOfferCreateDraft(organization.id),
    step: "general",
    loading: overrides.loading ?? false,
    isSubmitting: false,
    isSaving: false,
    error: null,
    validationMessage: null,
    draftSavedMessage: null,
    updateDraft: () => {},
    saveDraft: async () => {},
    submit: async () => null,
    cancel: () => {},
    setStep: () => {},
  };
}
