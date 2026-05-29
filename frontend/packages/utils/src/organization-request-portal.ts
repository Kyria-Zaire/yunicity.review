import type { OrganizationType } from "@yunicity/types";

import { resolveCityMapCenter } from "./map-city-defaults";
import {
  ORG_REQUEST_STEP_DETAILS,
  ORG_REQUEST_STEP_INFO,
  ORG_REQUEST_STEP_PHOTOS,
  ORG_REQUEST_STEP_PUBLISH,
  ORG_REQUEST_STEP_REVIEW,
  ORG_REQUEST_VALIDATION_ADDRESS,
  ORG_REQUEST_VALIDATION_CATEGORY,
  ORG_REQUEST_VALIDATION_NAME,
  ORG_REQUEST_VALIDATION_SHORT_DESC,
} from "./organization-request-portal-labels";

export type OrganizationRequestStepId =
  | "info"
  | "details"
  | "photos"
  | "review"
  | "publish";

export type OrganizationRequestStep = {
  id: OrganizationRequestStepId;
  label: string;
  order: number;
};

export type OrganizationRequestCategoryOption = {
  id: string;
  label: string;
  type: OrganizationType;
  category: string;
};

export type OrganizationRequestDraft = {
  name: string;
  categoryId: string;
  address: string;
  city: string;
  neighborhoodSlug: string;
  shortDescription: string;
  website: string;
  phone: string;
  postalCode: string;
  instagram: string;
  longDescription: string;
};

export type OrganizationRequestValidation = {
  valid: boolean;
  message: string | null;
};

export const ORG_REQUEST_SHORT_DESC_MAX = 120;

export const ORGANIZATION_REQUEST_STEPS: OrganizationRequestStep[] = [
  { id: "info", label: ORG_REQUEST_STEP_INFO, order: 1 },
  { id: "details", label: ORG_REQUEST_STEP_DETAILS, order: 2 },
  { id: "photos", label: ORG_REQUEST_STEP_PHOTOS, order: 3 },
  { id: "review", label: ORG_REQUEST_STEP_REVIEW, order: 4 },
  { id: "publish", label: ORG_REQUEST_STEP_PUBLISH, order: 5 },
];

/** Catégories maquette → type API + libellé stocké en `category`. */
export const ORGANIZATION_REQUEST_CATEGORY_OPTIONS: OrganizationRequestCategoryOption[] = [
  { id: "cafe_restaurant", label: "Cafés & Restaurants", type: "commerce", category: "Cafés & Restaurants" },
  { id: "commerce", label: "Commerces", type: "commerce", category: "Commerces" },
  { id: "cultural", label: "Lieux culturels", type: "association", category: "Lieux culturels" },
  { id: "leisure", label: "Loisirs & Activités", type: "commerce", category: "Loisirs & Activités" },
  { id: "services", label: "Services", type: "commerce", category: "Services" },
  { id: "nature", label: "Nature & Plein air", type: "other", category: "Nature & Plein air" },
];

export function createEmptyOrganizationRequestDraft(city = "Reims"): OrganizationRequestDraft {
  return {
    name: "",
    categoryId: "",
    address: "",
    city,
    neighborhoodSlug: "",
    shortDescription: "",
    website: "",
    phone: "",
    postalCode: "",
    instagram: "",
    longDescription: "",
  };
}

export function resolveOrganizationRequestCategory(
  categoryId: string,
): OrganizationRequestCategoryOption | null {
  return ORGANIZATION_REQUEST_CATEGORY_OPTIONS.find((option) => option.id === categoryId) ?? null;
}

export function validateOrganizationRequestStep(
  stepId: OrganizationRequestStepId,
  draft: OrganizationRequestDraft,
): OrganizationRequestValidation {
  if (stepId === "info") {
    if (draft.name.trim().length < 2) {
      return { valid: false, message: ORG_REQUEST_VALIDATION_NAME };
    }
    if (!draft.categoryId.trim()) {
      return { valid: false, message: ORG_REQUEST_VALIDATION_CATEGORY };
    }
    if (!draft.address.trim()) {
      return { valid: false, message: ORG_REQUEST_VALIDATION_ADDRESS };
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
  return { valid: true, message: null };
}

export function buildOrganizationRequestDescription(
  draft: OrganizationRequestDraft,
  neighborhoodLabel?: string | null,
): string {
  const parts: string[] = [];
  const short = draft.shortDescription.trim();
  const long = draft.longDescription.trim();
  if (short) parts.push(short);
  if (long && long !== short) parts.push(long);
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
