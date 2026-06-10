import type { AdminStaffPlatformRole } from "@yunicity/types";
import {
  STAFF_DEFAULT_PAGE_SIZE,
  STAFF_MAX_PAGE_SIZE,
  type AdminStaffActiveFilter,
  type AdminStaffRoleFilter,
} from "@yunicity/utils";

export interface AdminStaffListState {
  role: AdminStaffRoleFilter;
  status: AdminStaffActiveFilter;
  page: number;
  pageSize: number;
}

const STAFF_ROLES: AdminStaffPlatformRole[] = ["SUPER_ADMIN", "CITY_ADMIN", "MODERATOR"];

function parseRole(raw: string | null): AdminStaffRoleFilter {
  if (raw && STAFF_ROLES.includes(raw as AdminStaffPlatformRole)) {
    return raw as AdminStaffPlatformRole;
  }
  return "";
}

function parseStatus(raw: string | null): AdminStaffActiveFilter {
  if (raw === "active" || raw === "suspended") {
    return raw;
  }
  return "";
}

function parsePage(raw: string | null): number {
  const value = Number(raw ?? "1");
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

function parsePageSize(raw: string | null): number {
  const value = Number(raw ?? String(STAFF_DEFAULT_PAGE_SIZE));
  if (!Number.isFinite(value) || value < 1) {
    return STAFF_DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(value), STAFF_MAX_PAGE_SIZE);
}

export function parseStaffSearchParams(params: URLSearchParams): AdminStaffListState {
  const status =
    parseStatus(params.get("status")) || parseStatus(params.get("active"));

  return {
    role: parseRole(params.get("role")),
    status,
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("page_size")),
  };
}

export function staffStateToSearchParams(state: AdminStaffListState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.role) {
    params.set("role", state.role);
  }
  if (state.status) {
    params.set("status", state.status);
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== STAFF_DEFAULT_PAGE_SIZE) {
    params.set("page_size", String(state.pageSize));
  }
  return params;
}

export function toAdminStaffListParams(state: AdminStaffListState): {
  role?: string;
  is_active?: boolean;
  page: number;
  page_size: number;
} {
  return {
    role: state.role || undefined,
    is_active:
      state.status === "active" ? true : state.status === "suspended" ? false : undefined,
    page: state.page,
    page_size: state.pageSize,
  };
}
