import type { PartnerCreatorContentStatus } from "@yunicity/types";
import {
  CREATOR_CONTENT_DEFAULT_PAGE_SIZE,
  CREATOR_CONTENT_MAX_PAGE_SIZE,
  type AdminCreatorContentStatusFilter,
} from "@yunicity/utils";

export interface AdminCreatorContentListState {
  status: AdminCreatorContentStatusFilter;
  organizationId: string;
  page: number;
  pageSize: number;
}

const CONTENT_STATUSES: PartnerCreatorContentStatus[] = [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "archived",
];

function parseStatus(
  raw: string | null,
  hasOrganizationFilter: boolean,
): AdminCreatorContentStatusFilter {
  if (raw === "all") {
    return "";
  }
  if (raw && CONTENT_STATUSES.includes(raw as PartnerCreatorContentStatus)) {
    return raw as AdminCreatorContentStatusFilter;
  }
  if (raw === null) {
    return hasOrganizationFilter ? "" : "pending_review";
  }
  return "";
}

function parsePage(raw: string | null): number {
  const value = Number(raw ?? "1");
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

function parsePageSize(raw: string | null): number {
  const value = Number(raw ?? String(CREATOR_CONTENT_DEFAULT_PAGE_SIZE));
  if (!Number.isFinite(value) || value < 1) {
    return CREATOR_CONTENT_DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(value), CREATOR_CONTENT_MAX_PAGE_SIZE);
}

export function parseCreatorContentSearchParams(
  params: URLSearchParams,
): AdminCreatorContentListState {
  const organizationId = params.get("organization_id")?.trim() ?? "";
  return {
    status: parseStatus(params.get("status"), organizationId.length > 0),
    organizationId,
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("page_size")),
  };
}

export function creatorContentStateToSearchParams(
  state: AdminCreatorContentListState,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.status) {
    params.set("status", state.status);
  } else if (state.organizationId || state.page > 1) {
    params.set("status", "all");
  }
  if (state.organizationId) {
    params.set("organization_id", state.organizationId);
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== CREATOR_CONTENT_DEFAULT_PAGE_SIZE) {
    params.set("page_size", String(state.pageSize));
  }
  return params;
}

export function toAdminCreatorContentListParams(state: AdminCreatorContentListState): {
  status?: PartnerCreatorContentStatus;
  page: number;
  page_size: number;
  sort: "newest" | "oldest";
} {
  return {
    status: state.status || undefined,
    page: state.page,
    page_size: state.pageSize,
    sort: "newest",
  };
}
