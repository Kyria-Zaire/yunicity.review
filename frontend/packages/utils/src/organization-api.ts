import type {
  OrganizationCreateRequest,
  OrganizationCreateResponse,
  OrganizationMeListResponse,
  OrganizationPublic,
  OrganizationRequestPayload,
  OrganizationReviewPayload,
  OrganizationReviewResponse,
  OrganizationSummary,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export function buildOrganizationCreateRequest(
  payload: OrganizationRequestPayload,
): OrganizationCreateRequest {
  const descriptionParts: string[] = [];
  if (payload.description?.trim()) {
    descriptionParts.push(payload.description.trim());
  }
  if (payload.instagram?.trim()) {
    const handle = payload.instagram.trim();
    descriptionParts.push(
      handle.startsWith("http") ? `Instagram: ${handle}` : `Instagram: ${handle}`,
    );
  }

  if (payload.short_description?.trim() && descriptionParts.length === 0) {
    descriptionParts.push(payload.short_description.trim());
  }

  return {
    name: payload.name.trim(),
    type: payload.type,
    city: payload.city.trim(),
    category: payload.category?.trim() || undefined,
    address: payload.address?.trim() || undefined,
    postal_code: payload.postal_code?.trim() || undefined,
    phone: payload.phone?.trim() || undefined,
    website: payload.website?.trim() || undefined,
    description: descriptionParts.length > 0 ? descriptionParts.join("\n") : undefined,
  };
}

export class OrganizationApi extends ApiClientBase {
  listMyOrganizations(): Promise<OrganizationMeListResponse> {
    return this.getJson<OrganizationMeListResponse>("/organizations/me");
  }

  createOrganizationRequest(
    payload: OrganizationRequestPayload,
  ): Promise<OrganizationCreateResponse> {
    return this.postJson<OrganizationCreateResponse>(
      "/organizations/request",
      buildOrganizationCreateRequest(payload),
    );
  }

  getOrganizationBySlug(slug: string): Promise<OrganizationPublic> {
    return this.getJson<OrganizationPublic>(
      `/organizations/${encodeURIComponent(slug)}`,
    );
  }

  reviewOrganization(
    organizationId: string,
    payload: OrganizationReviewPayload,
  ): Promise<OrganizationReviewResponse> {
    return this.postJson<OrganizationReviewResponse>(
      `/organizations/${encodeURIComponent(organizationId)}/review`,
      payload,
    );
  }
}

export function createOrganizationApi(
  client: AuthClient,
  apiBaseUrl: string,
): OrganizationApi {
  return new OrganizationApi(client, apiBaseUrl);
}

export function filterPublicOrganizations(
  items: OrganizationSummary[],
): OrganizationSummary[] {
  return items.filter(
    (org) => org.verification_status === "verified" && org.visibility === "public",
  );
}
