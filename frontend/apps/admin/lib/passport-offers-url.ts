import type { AdminOfferStatus, PartnerOfferType } from "@yunicity/types";

export const PASSPORT_OFFERS_DEFAULT_PAGE_SIZE = 20;
export const PASSPORT_OFFERS_MAX_PAGE_SIZE = 50;

export type AdminOfferStatusFilter = "" | AdminOfferStatus;
export type AdminOfferTypeFilter = "" | PartnerOfferType;

export interface PassportOffersListState {
  status: AdminOfferStatusFilter;
  organizationId: string;
  offerType: AdminOfferTypeFilter;
  page: number;
  pageSize: number;
}

const OFFER_STATUSES: AdminOfferStatus[] = [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "archived",
];

const OFFER_TYPES: PartnerOfferType[] = [
  "drink",
  "discount",
  "vip",
  "gift",
  "event_access",
  "custom",
];

function parseStatus(
  raw: string | null,
  hasOrganizationFilter: boolean,
): AdminOfferStatusFilter {
  if (raw === "all") {
    return "";
  }
  if (raw && OFFER_STATUSES.includes(raw as AdminOfferStatus)) {
    return raw as AdminOfferStatus;
  }
  if (raw === null) {
    return hasOrganizationFilter ? "" : "pending_review";
  }
  return "";
}

function parseOfferType(raw: string | null): AdminOfferTypeFilter {
  if (!raw) {
    return "";
  }
  return OFFER_TYPES.includes(raw as PartnerOfferType) ? (raw as PartnerOfferType) : "";
}

function parsePage(raw: string | null): number {
  const value = Number(raw ?? "1");
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

function parsePageSize(raw: string | null): number {
  const value = Number(raw ?? String(PASSPORT_OFFERS_DEFAULT_PAGE_SIZE));
  if (!Number.isFinite(value) || value < 1) {
    return PASSPORT_OFFERS_DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(value), PASSPORT_OFFERS_MAX_PAGE_SIZE);
}

export function parsePassportOffersSearchParams(
  params: URLSearchParams,
): PassportOffersListState {
  const organizationId = params.get("organization_id")?.trim() ?? "";
  return {
    status: parseStatus(params.get("status"), organizationId.length > 0),
    organizationId,
    offerType: parseOfferType(params.get("offer_type")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("page_size")),
  };
}

export function passportOffersStateToSearchParams(
  state: PassportOffersListState,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.status) {
    params.set("status", state.status);
  } else if (state.organizationId || state.offerType || state.page > 1) {
    params.set("status", "all");
  }
  if (state.organizationId) {
    params.set("organization_id", state.organizationId);
  }
  if (state.offerType) {
    params.set("offer_type", state.offerType);
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== PASSPORT_OFFERS_DEFAULT_PAGE_SIZE) {
    params.set("page_size", String(state.pageSize));
  }
  return params;
}

export function toAdminOfferListParams(state: PassportOffersListState): {
  status?: AdminOfferStatus;
  offer_type?: PartnerOfferType;
  organization_id?: string;
  page: number;
  page_size: number;
} {
  return {
    status: state.status || undefined,
    offer_type: state.offerType || undefined,
    organization_id: state.organizationId || undefined,
    page: state.page,
    page_size: state.pageSize,
  };
}
