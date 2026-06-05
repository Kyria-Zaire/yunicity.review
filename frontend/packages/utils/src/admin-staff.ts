/** Admin platform staff helpers (ADMIN-08C). */

import type { AdminStaffActionType, AdminStaffPlatformRole } from "@yunicity/types";

export const STAFF_DEFAULT_PAGE_SIZE = 20;
export const STAFF_MAX_PAGE_SIZE = 50;

export type AdminStaffRoleFilter = "" | AdminStaffPlatformRole;
export type AdminStaffActiveFilter = "" | "active" | "suspended";

export const ADMIN_STAFF_ROLE_FILTER_OPTIONS: {
  value: AdminStaffRoleFilter;
  label: string;
}[] = [
  { value: "", label: "Tous les rôles" },
  { value: "SUPER_ADMIN", label: "Super administrateur" },
  { value: "CITY_ADMIN", label: "Admin ville" },
  { value: "MODERATOR", label: "Modérateur" },
];

export const ADMIN_STAFF_ACTIVE_FILTER_OPTIONS: {
  value: AdminStaffActiveFilter;
  label: string;
}[] = [
  { value: "", label: "Tous les statuts" },
  { value: "active", label: "Actifs" },
  { value: "suspended", label: "Suspendus" },
];

export const STAFF_ROLE_LABELS: Record<AdminStaffPlatformRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  CITY_ADMIN: "Admin ville",
  MODERATOR: "Modérateur",
};

export const STAFF_ACTION_LABELS: Record<AdminStaffActionType, string> = {
  assign_role: "Attribution de rôle",
  revoke_role: "Retrait de rôle",
  suspend: "Suspension du compte",
  reactivate: "Réactivation du compte",
};

export function staffRoleLabel(role: string): string {
  if (role in STAFF_ROLE_LABELS) {
    return STAFF_ROLE_LABELS[role as AdminStaffPlatformRole];
  }
  return role;
}

export function staffActionLabel(action: AdminStaffActionType | string): string {
  if (action in STAFF_ACTION_LABELS) {
    return STAFF_ACTION_LABELS[action as AdminStaffActionType];
  }
  return action;
}

export function staffStatusLabel(isActive: boolean): string {
  return isActive ? "Actif" : "Suspendu";
}

export function formatStaffRolesList(roles: string[] | null | undefined): string {
  if (!roles?.length) {
    return "—";
  }
  return roles.map(staffRoleLabel).join(", ");
}

export function buildStaffListPath(params?: URLSearchParams): string {
  const qs = params?.toString();
  return qs ? `/staff?${qs}` : "/staff";
}

export function buildStaffDetailPath(
  staffId: string,
  listSearchParams?: URLSearchParams | null,
): string {
  const qs = listSearchParams?.toString();
  return qs ? `/staff/${staffId}?${qs}` : `/staff/${staffId}`;
}

export function buildStaffListBackPath(searchParams: URLSearchParams | null): string {
  if (!searchParams) {
    return "/staff";
  }
  const params = new URLSearchParams();
  for (const key of ["role", "active", "page", "page_size"] as const) {
    const value = searchParams.get(key);
    if (value) {
      params.set(key, value);
    }
  }
  return buildStaffListPath(params);
}

export function formatStaffDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
