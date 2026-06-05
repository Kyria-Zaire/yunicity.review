/** Admin platform staff helpers (ADMIN-08C / ADMIN-08D). */

import type {
  AdminStaffActionType,
  AdminStaffDetailResponse,
  AdminStaffPlatformRole,
} from "@yunicity/types";

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

/** Rôles staff assignables en V1 (aligné backend 08B). */
export const STAFF_ASSIGNABLE_ROLES: readonly AdminStaffPlatformRole[] = [
  "MODERATOR",
  "CITY_ADMIN",
  "SUPER_ADMIN",
];

export const STAFF_SELF_MODIFY_COPY =
  "Vous ne pouvez pas modifier votre propre accès staff.";

export const STAFF_REVOKE_SECURITY_COPY =
  "La suppression du dernier super administrateur actif est bloquée par le système.";

export const STAFF_SUSPEND_WARNING_COPY =
  "Le compte ne pourra plus accéder à l'admin.";

export const STAFF_REASON_MAX_LENGTH = 1000;

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

export function isStaffSelfTarget(
  currentUserId: string | null | undefined,
  targetStaffId: string,
): boolean {
  return Boolean(currentUserId && currentUserId === targetStaffId);
}

export function availableStaffRolesForAssignment(
  assignedRoles: string[] | null | undefined,
): AdminStaffPlatformRole[] {
  const assigned = new Set(assignedRoles ?? []);
  return STAFF_ASSIGNABLE_ROLES.filter((role) => !assigned.has(role));
}

export function canAssignStaffRole(
  staff: Pick<AdminStaffDetailResponse, "id">,
  currentUserId: string | null | undefined,
  role: AdminStaffPlatformRole,
  assignedRoles: string[],
): boolean {
  if (isStaffSelfTarget(currentUserId, staff.id)) {
    return false;
  }
  if (assignedRoles.includes(role)) {
    return false;
  }
  return STAFF_ASSIGNABLE_ROLES.includes(role);
}

export function canRevokeStaffRole(
  staff: Pick<AdminStaffDetailResponse, "id">,
  currentUserId: string | null | undefined,
  role: string,
  assignedRoles: string[],
): boolean {
  if (isStaffSelfTarget(currentUserId, staff.id)) {
    return false;
  }
  return (
    assignedRoles.includes(role) &&
    STAFF_ASSIGNABLE_ROLES.includes(role as AdminStaffPlatformRole)
  );
}

export function canSuspendStaffUser(
  staff: Pick<AdminStaffDetailResponse, "id" | "is_active">,
  currentUserId: string | null | undefined,
): boolean {
  if (isStaffSelfTarget(currentUserId, staff.id)) {
    return false;
  }
  return staff.is_active;
}

export function canReactivateStaffUser(
  staff: Pick<AdminStaffDetailResponse, "id" | "is_active">,
  currentUserId: string | null | undefined,
): boolean {
  if (isStaffSelfTarget(currentUserId, staff.id)) {
    return false;
  }
  return !staff.is_active;
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
