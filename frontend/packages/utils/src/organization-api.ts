import type {
  OrganizationCreateRequest,
  OrganizationCreateResponse,
  OrganizationMeListResponse,
  OrganizationPublic,
  OrganizationRequestPayload,
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

  return {
    name: payload.name.trim(),
    type: payload.type,
    city: payload.city.trim(),
    address: payload.address?.trim() || undefined,
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
