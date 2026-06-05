import { describe, expect, it } from "vitest";

import {
  availableStaffRolesForAssignment,
  buildStaffDetailPath,
  buildStaffListBackPath,
  buildStaffListPath,
  canAssignStaffRole,
  canReactivateStaffUser,
  canSuspendStaffUser,
  formatStaffRolesList,
  staffActionLabel,
  staffRoleLabel,
  staffStatusLabel,
} from "./admin-staff";

describe("staffRoleLabel", () => {
  it("maps known platform roles", () => {
    expect(staffRoleLabel("SUPER_ADMIN")).toBe("Super administrateur");
    expect(staffRoleLabel("CITY_ADMIN")).toBe("Admin ville");
    expect(staffRoleLabel("MODERATOR")).toBe("Modérateur");
  });
});

describe("staffActionLabel", () => {
  it("maps known staff audit actions", () => {
    expect(staffActionLabel("assign_role")).toBe("Attribution de rôle");
    expect(staffActionLabel("revoke_role")).toBe("Retrait de rôle");
    expect(staffActionLabel("suspend")).toBe("Suspension du compte");
    expect(staffActionLabel("reactivate")).toBe("Réactivation du compte");
  });
});

describe("staffStatusLabel", () => {
  it("maps account status", () => {
    expect(staffStatusLabel(true)).toBe("Actif");
    expect(staffStatusLabel(false)).toBe("Suspendu");
  });
});

describe("formatStaffRolesList", () => {
  it("formats role arrays with French labels", () => {
    expect(formatStaffRolesList(["MODERATOR", "CITY_ADMIN"])).toBe(
      "Modérateur, Admin ville",
    );
    expect(formatStaffRolesList(null)).toBe("—");
  });
});

describe("availableStaffRolesForAssignment", () => {
  it("excludes roles already assigned", () => {
    expect(availableStaffRolesForAssignment(["MODERATOR", "SUPER_ADMIN"])).toEqual([
      "CITY_ADMIN",
    ]);
    expect(availableStaffRolesForAssignment([])).toEqual([
      "MODERATOR",
      "CITY_ADMIN",
      "SUPER_ADMIN",
    ]);
  });
});

describe("staff action guards", () => {
  const staff = { id: "target-1", is_active: true };

  it("disables assign when role is already assigned", () => {
    expect(
      canAssignStaffRole(staff, "actor-1", "MODERATOR", ["MODERATOR", "CITY_ADMIN"]),
    ).toBe(false);
    expect(
      canAssignStaffRole(staff, "actor-1", "SUPER_ADMIN", ["MODERATOR"]),
    ).toBe(true);
  });

  it("disables suspend for self target", () => {
    expect(canSuspendStaffUser(staff, "target-1")).toBe(false);
    expect(canSuspendStaffUser(staff, "actor-1")).toBe(true);
  });

  it("allows reactivate only when account is suspended", () => {
    expect(canReactivateStaffUser({ ...staff, is_active: false }, "actor-1")).toBe(true);
    expect(canReactivateStaffUser(staff, "actor-1")).toBe(false);
    expect(canReactivateStaffUser({ ...staff, is_active: false }, "target-1")).toBe(false);
  });
});

describe("staff paths", () => {
  it("builds list and detail paths", () => {
    expect(buildStaffListPath()).toBe("/staff");
    const params = new URLSearchParams({ role: "MODERATOR", page: "2" });
    expect(buildStaffListPath(params)).toBe("/staff?role=MODERATOR&page=2");
    expect(buildStaffDetailPath("abc-123", params)).toBe(
      "/staff/abc-123?role=MODERATOR&page=2",
    );
  });

  it("builds list back path from detail search params", () => {
    const params = new URLSearchParams({
      role: "SUPER_ADMIN",
      active: "active",
      page: "1",
    });
    expect(buildStaffListBackPath(params)).toBe(
      "/staff?role=SUPER_ADMIN&active=active&page=1",
    );
    expect(buildStaffListBackPath(null)).toBe("/staff");
  });
});
