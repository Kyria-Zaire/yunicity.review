import type { OrganizationType } from "@yunicity/types";

import { resolveCityMapCenter } from "./map-city-defaults";
import {
  ORG_REQUEST_STEP_ADDRESS,
  ORG_REQUEST_STEP_ADDRESS_HINT,
  ORG_REQUEST_STEP_IDENTITY,
  ORG_REQUEST_STEP_IDENTITY_HINT,
  ORG_REQUEST_STEP_PRACTICAL,
  ORG_REQUEST_STEP_PRACTICAL_HINT,
  ORG_REQUEST_STEP_VERIFICATION,
  ORG_REQUEST_STEP_VERIFICATION_HINT,
  ORG_REQUEST_STEP_VISUALS,
  ORG_REQUEST_STEP_VISUALS_HINT,
  ORG_REQUEST_VALIDATION_ADDRESS,
  ORG_REQUEST_VALIDATION_CATEGORY,
  ORG_REQUEST_VALIDATION_NAME,
  ORG_REQUEST_VALIDATION_SHORT_DESC,
} from "./organization-request-portal-labels";

export type OrganizationRequestStepId =
  | "identity"
  | "address"
  | "practical"
  | "visuals"
  | "verification";

export type OrganizationRequestStep = {
  id: OrganizationRequestStepId;
  label: string;
  hint: string;
  order: number;
};

export type OrganizationRequestCategoryOption = {
  id: string;
  label: string;
  type: OrganizationType;
  category: string;
  badgeLabel: string;
  badgeTone: "culture" | "nature" | "food" | "commerce" | "sport" | "services" | "default";
};

export type OrganizationRequestPlaceTypeOption = {
  id: string;
  label: string;
};

export type OrganizationRequestDraft = {
  name: string;
  categoryId: string;
  placeTypeId: string;
  address: string;
  city: string;
  neighborhoodSlug: string;
  shortDescription: string;
  website: string;
  phone: string;
  postalCode: string;
  instagram: string;
  longDescription: string;
  isOfficialRepresentative: boolean;
};

export type OrganizationRequestValidation = {
  valid: boolean;
  message: string | null;
};

export type OrganizationRequestChecklistKey =
  | "identity"
  | "address"
  | "practical"
  | "visual"
  | "review";

export const ORG_REQUEST_NAME_MAX = 80;
export const ORG_REQUEST_SHORT_DESC_MAX = 140;

export const ORGANIZATION_REQUEST_STEPS: OrganizationRequestStep[] = [
  {
    id: "identity",
    label: ORG_REQUEST_STEP_IDENTITY,
    hint: ORG_REQUEST_STEP_IDENTITY_HINT,
    order: 1,
  },
  {
    id: "address",
    label: ORG_REQUEST_STEP_ADDRESS,
    hint: ORG_REQUEST_STEP_ADDRESS_HINT,
    order: 2,
  },
  {
    id: "practical",
    label: ORG_REQUEST_STEP_PRACTICAL,
    hint: ORG_REQUEST_STEP_PRACTICAL_HINT,
    order: 3,
  },
  {
    id: "visuals",
    label: ORG_REQUEST_STEP_VISUALS,
    hint: ORG_REQUEST_STEP_VISUALS_HINT,
    order: 4,
  },
  {
    id: "verification",
    label: ORG_REQUEST_STEP_VERIFICATION,
    hint: ORG_REQUEST_STEP_VERIFICATION_HINT,
    order: 5,
  },
];

/** Catégories maquette → type API + libellé stocké en `category`. */
export const ORGANIZATION_REQUEST_CATEGORY_OPTIONS: OrganizationRequestCategoryOption[] = [
  {
    id: "cultural",
    label: "Culture et patrimoine",
    type: "association",
    category: "Lieux culturels",
    badgeLabel: "CULTURE",
    badgeTone: "culture",
  },
  {
    id: "nature",
    label: "Nature et jardins",
    type: "other",
    category: "Nature & Plein air",
    badgeLabel: "NATURE",
    badgeTone: "nature",
  },
  {
    id: "cafe_restaurant",
    label: "Restaurants et cafés",
    type: "commerce",
    category: "Cafés & Restaurants",
    badgeLabel: "RESTAURANT",
    badgeTone: "food",
  },
  {
    id: "commerce",
    label: "Commerces",
    type: "commerce",
    category: "Commerces",
    badgeLabel: "COMMERCE",
    badgeTone: "commerce",
  },
  {
    id: "leisure",
    label: "Sport et bien-être",
    type: "commerce",
    category: "Loisirs & Activités",
    badgeLabel: "SPORT",
    badgeTone: "sport",
  },
  {
    id: "services",
    label: "Services",
    type: "commerce",
    category: "Services",
    badgeLabel: "SERVICE",
    badgeTone: "services",
  },
  {
    id: "other",
    label: "Autre",
    type: "other",
    category: "Autre",
    badgeLabel: "LIEU",
    badgeTone: "default",
  },
];

export const ORGANIZATION_REQUEST_PLACE_TYPES: Record<
  string,
  OrganizationRequestPlaceTypeOption[]
> = {
  cultural: [
    { id: "cultural_space", label: "Espace culturel" },
    { id: "museum", label: "Musée" },
    { id: "gallery", label: "Galerie" },
    { id: "heritage", label: "Patrimoine" },
  ],
  nature: [
    { id: "park", label: "Parc ou jardin" },
    { id: "trail", label: "Sentier ou espace vert" },
    { id: "garden", label: "Jardin partagé" },
  ],
  cafe_restaurant: [
    { id: "cafe", label: "Café" },
    { id: "restaurant", label: "Restaurant" },
    { id: "bar", label: "Bar ou brasserie" },
  ],
  commerce: [
    { id: "shop", label: "Commerce de proximité" },
    { id: "market", label: "Marché" },
    { id: "artisan", label: "Artisan" },
  ],
  leisure: [
    { id: "sport_club", label: "Club ou salle de sport" },
    { id: "wellness", label: "Bien-être" },
    { id: "outdoor", label: "Activité plein air" },
  ],
  services: [
    { id: "public_service", label: "Service public" },
    { id: "association", label: "Association" },
    { id: "professional", label: "Professionnel" },
  ],
  other: [{ id: "other", label: "Autre type" }],
};

export function createEmptyOrganizationRequestDraft(city = "Reims"): OrganizationRequestDraft {
  return {
    name: "",
    categoryId: "",
    placeTypeId: "",
    address: "",
    city,
    neighborhoodSlug: "",
    shortDescription: "",
    website: "",
    phone: "",
    postalCode: "",
    instagram: "",
    longDescription: "",
    isOfficialRepresentative: false,
  };
}

export function resolveOrganizationRequestCategory(
  categoryId: string,
): OrganizationRequestCategoryOption | null {
  return ORGANIZATION_REQUEST_CATEGORY_OPTIONS.find((option) => option.id === categoryId) ?? null;
}

export function resolveOrganizationRequestPlaceType(
  categoryId: string,
  placeTypeId: string,
): OrganizationRequestPlaceTypeOption | null {
  const options = ORGANIZATION_REQUEST_PLACE_TYPES[categoryId] ?? [];
  return options.find((option) => option.id === placeTypeId) ?? null;
}

export function defaultOrganizationRequestPlaceTypeId(categoryId: string): string {
  return ORGANIZATION_REQUEST_PLACE_TYPES[categoryId]?.[0]?.id ?? "";
}

export function validateOrganizationRequestStep(
  stepId: OrganizationRequestStepId,
  draft: OrganizationRequestDraft,
): OrganizationRequestValidation {
  if (stepId === "identity") {
    if (draft.name.trim().length < 2) {
      return { valid: false, message: ORG_REQUEST_VALIDATION_NAME };
    }
    if (!draft.categoryId.trim()) {
      return { valid: false, message: ORG_REQUEST_VALIDATION_CATEGORY };
    }
    if (!draft.shortDescription.trim()) {
      return { valid: false, message: ORG_REQUEST_VALIDATION_SHORT_DESC };
    }
    if (draft.shortDescription.trim().length > ORG_REQUEST_SHORT_DESC_MAX) {
      return { valid: false, message: ORG_REQUEST_VALIDATION_SHORT_DESC };
    }
    if (!draft.city.trim()) {
      return { valid: false, message: ORG_REQUEST_VALIDATION_ADDRESS };
    }
  }

  if (stepId === "address") {
    if (!draft.address.trim()) {
      return { valid: false, message: ORG_REQUEST_VALIDATION_ADDRESS };
    }
  }

  return { valid: true, message: null };
}

export function validateOrganizationRequestDraft(
  draft: OrganizationRequestDraft,
): OrganizationRequestValidation {
  for (const step of ["identity", "address"] as const) {
    const result = validateOrganizationRequestStep(step, draft);
    if (!result.valid) return result;
  }
  return { valid: true, message: null };
}

export function organizationRequestChecklistState(
  draft: OrganizationRequestDraft,
): Record<OrganizationRequestChecklistKey, boolean> {
  const identityValid = validateOrganizationRequestStep("identity", draft).valid;
  const addressValid = validateOrganizationRequestStep("address", draft).valid;
  const hasPractical =
    Boolean(draft.website.trim()) ||
    Boolean(draft.phone.trim()) ||
    Boolean(draft.postalCode.trim()) ||
    Boolean(draft.instagram.trim()) ||
    Boolean(draft.longDescription.trim());

  return {
    identity: identityValid,
    address: addressValid,
    practical: hasPractical,
    visual: false,
    review: identityValid && addressValid,
  };
}

export function organizationRequestChecklistProgress(draft: OrganizationRequestDraft): {
  completed: number;
  total: number;
} {
  const state = organizationRequestChecklistState(draft);
  const flags = [state.identity, state.address, state.practical, state.visual, state.review];
  return { completed: flags.filter(Boolean).length, total: flags.length };
}

export function organizationRequestStepProgressPercent(stepId: OrganizationRequestStepId): number {
  const index = ORGANIZATION_REQUEST_STEPS.findIndex((step) => step.id === stepId);
  if (index < 0) return 0;
  return Math.round(((index + 1) / ORGANIZATION_REQUEST_STEPS.length) * 100);
}

export function organizationRequestNextStepLabel(
  stepId: OrganizationRequestStepId,
): string {
  const labels: Record<OrganizationRequestStepId, string> = {
    identity: "Continuer vers l'adresse et la carte",
    address: "Continuer vers les informations pratiques",
    practical: "Continuer vers les visuels",
    visuals: "Continuer vers la vérification",
    verification: "Envoyer la proposition",
  };
  return labels[stepId];
}

export function buildOrganizationRequestDescription(
  draft: OrganizationRequestDraft,
  neighborhoodLabel?: string | null,
): string {
  const parts: string[] = [];
  const short = draft.shortDescription.trim();
  const long = draft.longDescription.trim();
  const placeType = resolveOrganizationRequestPlaceType(draft.categoryId, draft.placeTypeId);

  if (short) parts.push(short);
  if (long && long !== short) parts.push(long);
  if (placeType?.label) {
    parts.push(`Type : ${placeType.label}`);
  }
  if (neighborhoodLabel?.trim()) {
    parts.push(`Quartier : ${neighborhoodLabel.trim()}`);
  }
  if (draft.instagram.trim()) {
    const handle = draft.instagram.trim();
    parts.push(handle.startsWith("http") ? `Instagram: ${handle}` : `Instagram: ${handle}`);
  }
  return parts.join("\n\n");
}

export function buildOrganizationRequestMapPreview(params: {
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}): { latitude: number; longitude: number; zoom: number; openMapHref: string } {
  const fallback = resolveCityMapCenter(params.city);
  const latitude = params.latitude ?? fallback.latitude;
  const longitude = params.longitude ?? fallback.longitude;
  const zoom = params.latitude != null && params.longitude != null ? 15 : fallback.zoom;
  const openMapHref = `/map?city=${encodeURIComponent(params.city.trim() || "Reims")}`;
  return { latitude, longitude, zoom, openMapHref };
}

export function organizationRequestStepIndex(stepId: OrganizationRequestStepId): number {
  return ORGANIZATION_REQUEST_STEPS.findIndex((step) => step.id === stepId);
}

export function nextOrganizationRequestStep(
  stepId: OrganizationRequestStepId,
): OrganizationRequestStepId | null {
  const index = organizationRequestStepIndex(stepId);
  const next = ORGANIZATION_REQUEST_STEPS[index + 1];
  return next?.id ?? null;
}

export function previousOrganizationRequestStep(
  stepId: OrganizationRequestStepId,
): OrganizationRequestStepId | null {
  const index = organizationRequestStepIndex(stepId);
  const prev = ORGANIZATION_REQUEST_STEPS[index - 1];
  return prev?.id ?? null;
}

const ORG_REQUEST_DRAFT_STORAGE_KEY = "yunicity:org-request-draft:v2";

export function persistOrganizationRequestDraft(
  draft: OrganizationRequestDraft,
  step: OrganizationRequestStepId,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ORG_REQUEST_DRAFT_STORAGE_KEY,
      JSON.stringify({ draft, step, savedAt: new Date().toISOString() }),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function loadOrganizationRequestDraft():
  | { draft: OrganizationRequestDraft; step: OrganizationRequestStepId }
  | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ORG_REQUEST_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      draft?: OrganizationRequestDraft;
      step?: OrganizationRequestStepId;
    };
    if (!parsed.draft || !parsed.step) return null;
    return {
      draft: { ...createEmptyOrganizationRequestDraft(), ...parsed.draft },
      step: parsed.step,
    };
  } catch {
    return null;
  }
}

export function clearOrganizationRequestDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ORG_REQUEST_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
