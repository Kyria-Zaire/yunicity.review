import { describe, expect, it } from "vitest";

import type { AuthUser } from "@yunicity/types";

import {
  STAFF_PERMISSIONS,
  hasAnyPermission,
  isStaffUser,
} from "./staff-permissions";

function userWithPermissions(permissions: AuthUser["permissions"]): AuthUser {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    email: "user@yunicity.test",
    full_name: "Test User",
    city: null,
    is_active: true,
    is_verified: true,
    roles: ["USER"],
    permissions,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("hasAnyPermission", () => {
  it("retourne true si au moins une permission correspond", () => {
    const user = userWithPermissions(["auth.me.read", "moderation.manage"]);
    expect(hasAnyPermission(user, ["moderation.manage", "system.admin"])).toBe(true);
  });

  it("retourne false si aucune permission ne correspond", () => {
    expect(hasAnyPermission(userWithPermissions(["auth.me.read"]), STAFF_PERMISSIONS)).toBe(
      false,
    );
  });

  it("retourne false pour user null", () => {
    expect(hasAnyPermission(null, STAFF_PERMISSIONS)).toBe(false);
  });
});

describe("isStaffUser", () => {
  it("autorise moderation.manage (MODERATOR)", () => {
    expect(isStaffUser(userWithPermissions(["moderation.manage"]))).toBe(true);
  });

  it("autorise system.admin (SUPER_ADMIN)", () => {
    expect(isStaffUser(userWithPermissions(["system.admin"]))).toBe(true);
  });

  it("refuse un USER simple", () => {
    expect(isStaffUser(userWithPermissions(["auth.me.read", "users.read.self"]))).toBe(false);
  });

  it("refuse null", () => {
    expect(isStaffUser(null)).toBe(false);
  });
});
