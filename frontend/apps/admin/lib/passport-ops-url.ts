import type { AdminPassportSearchMode, AdminPassportStatus } from "@yunicity/types";
import {
  ADMIN_PASSPORT_SEARCH_MODE_AUTO,
  type AdminPassportSearchModeOption,
  DEFAULT_PASSPORT_OPS_CITY,
} from "@yunicity/utils";

export const PASSPORT_OPS_DEFAULT_PAGE_SIZE = 20;

export type PassportOpsStatusFilter = "" | AdminPassportStatus;

export interface PassportOpsListState {
  city: string;
  q: string;
  status: PassportOpsStatusFilter;
  searchMode: AdminPassportSearchModeOption;
  page: number;
}

export function parsePassportOpsSearchParams(
  params: URLSearchParams,
): PassportOpsListState {
  const statusRaw = params.get("status");
  const status: PassportOpsStatusFilter =
    statusRaw === "active" || statusRaw === "suspended" ? statusRaw : "";

  const modeRaw = params.get("search_mode");
  const searchMode: AdminPassportSearchModeOption =
    modeRaw === "email" ||
    modeRaw === "passport_number" ||
    modeRaw === "display_name" ||
    modeRaw === "qr_fragment"
      ? modeRaw
      : ADMIN_PASSPORT_SEARCH_MODE_AUTO;

  const pageRaw = Number(params.get("page") ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  return {
    city: params.get("city")?.trim() || DEFAULT_PASSPORT_OPS_CITY,
    q: params.get("q")?.trim() ?? "",
    status,
    searchMode,
    page,
  };
}

export function passportOpsStateToSearchParams(state: PassportOpsListState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.city && state.city !== DEFAULT_PASSPORT_OPS_CITY) {
    params.set("city", state.city);
  }
  if (state.q) {
    params.set("q", state.q);
  }
  if (state.status) {
    params.set("status", state.status);
  }
  if (state.searchMode !== ADMIN_PASSPORT_SEARCH_MODE_AUTO) {
    params.set("search_mode", state.searchMode);
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  return params;
}

export function toAdminPassportListParams(state: PassportOpsListState): {
  city: string;
  status?: AdminPassportStatus;
  q?: string;
  search_mode?: AdminPassportSearchMode;
  page: number;
  page_size: number;
} {
  return {
    city: state.city,
    status: state.status || undefined,
    q: state.q || undefined,
    search_mode:
      state.searchMode === ADMIN_PASSPORT_SEARCH_MODE_AUTO
        ? undefined
        : state.searchMode,
    page: state.page,
    page_size: PASSPORT_OPS_DEFAULT_PAGE_SIZE,
  };
}
