import type { AuthUser, PermissionKey } from "@yunicity/types";

/** Permissions requises pour toute zone admin métier (CRM, zones protégées). */
export const STAFF_PERMISSIONS: PermissionKey[] = [
  "moderation.manage",
  "system.admin",
];

export function hasAnyPermission(
  user: AuthUser | null,
  permissions: readonly PermissionKey[],
): boolean {
  if (!user) {
    return false;
  }
  return permissions.some((permission) => user.permissions.includes(permission));
}

export function isStaffUser(user: AuthUser | null): boolean {
  return hasAnyPermission(user, STAFF_PERMISSIONS);
}
