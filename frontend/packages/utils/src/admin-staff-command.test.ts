import { describe, expect, it } from "vitest";

import {
  STAFF_CRITICAL_ROLE_COUNT,
  buildStaffConseilAction,
  buildStaffConseilMessage,
  buildStaffKpiCards,
  buildStaffMetricsFromSummary,
  buildStaffNextAction,
  buildStaffOrganizationalHealth,
  buildStaffSignal,
  staffHasActiveFilters,
  staffRoleFilteredEmptyMessage,
} from "./admin-staff-command";

const baseSummary = {
  generated_at: "2026-06-04T10:00:00.000Z",
  total: 0,
  active: 0,
  suspended: 0,
  super_admins: 0,
  city_admins: 0,
  moderators: 0,
  dominant_role: null,
} as const;

describe("buildStaffSignal", () => {
  it("prioritizes suspended accounts", () => {
    const metrics = buildStaffMetricsFromSummary({
      ...baseSummary,
      total: 4,
      active: 2,
      suspended: 2,
      super_admins: 1,
      city_admins: 1,
      moderators: 1,
    });
    const signal = buildStaffSignal(metrics);
    expect(signal.title).toContain("revue");
    expect(signal.description).toContain("2");
  });

  it("signals missing moderator", () => {
    const metrics = buildStaffMetricsFromSummary({
      ...baseSummary,
      total: 2,
      active: 2,
      super_admins: 1,
      city_admins: 1,
    });
    expect(buildStaffSignal(metrics).title).toContain("incomplète");
  });

  it("signals missing city admin", () => {
    const metrics = buildStaffMetricsFromSummary({
      ...baseSummary,
      total: 2,
      active: 2,
      super_admins: 1,
      moderators: 1,
    });
    expect(buildStaffSignal(metrics).title).toContain("Relais ville");
  });

  it("signals stable governance", () => {
    const metrics = buildStaffMetricsFromSummary({
      ...baseSummary,
      total: 3,
      active: 3,
      super_admins: 1,
      city_admins: 1,
      moderators: 1,
    });
    expect(buildStaffSignal(metrics).title).toContain("stable");
  });

  it("signals empty roster", () => {
    expect(buildStaffSignal(buildStaffMetricsFromSummary(baseSummary)).title).toContain(
      "Aucun compte staff",
    );
  });
});

describe("buildStaffNextAction", () => {
  it("never routes to moderation", () => {
    const scenarios = [
      baseSummary,
      { ...baseSummary, total: 1, active: 1, super_admins: 1 },
      { ...baseSummary, total: 2, active: 1, suspended: 1, super_admins: 2, city_admins: 1, moderators: 1 },
      { ...baseSummary, total: 2, active: 2, super_admins: 1, city_admins: 1 },
      { ...baseSummary, total: 4, active: 4, super_admins: 3, city_admins: 1, moderators: 1 },
    ];
    for (const summary of scenarios) {
      const action = buildStaffNextAction(buildStaffMetricsFromSummary(summary));
      expect(action.href).not.toContain("/moderation");
      expect(action.href.startsWith("/staff")).toBe(true);
    }
  });

  it("routes suspended queue to status filter", () => {
    const action = buildStaffNextAction(
      buildStaffMetricsFromSummary({
        ...baseSummary,
        total: 3,
        active: 2,
        suspended: 1,
        super_admins: 2,
        city_admins: 1,
        moderators: 1,
      }),
    );
    expect(action.href).toContain("status=suspended");
  });

  it("routes moderator gap to role filter", () => {
    const action = buildStaffNextAction(
      buildStaffMetricsFromSummary({
        ...baseSummary,
        total: 2,
        active: 2,
        super_admins: 2,
        city_admins: 1,
      }),
    );
    expect(action.href).toContain("role=MODERATOR");
    expect(action.ctaLabel).toContain("modérateurs");
  });

  it("routes empty roster to staff refresh", () => {
    const action = buildStaffNextAction(buildStaffMetricsFromSummary(baseSummary));
    expect(action.href).toBe("/staff");
    expect(action.ctaLabel).toBe("Actualiser");
  });
});

describe("buildStaffOrganizationalHealth", () => {
  it("scores 0/3", () => {
    const health = buildStaffOrganizationalHealth(buildStaffMetricsFromSummary(baseSummary));
    expect(health.presentRolesCount).toBe(0);
    expect(health.totalRoles).toBe(STAFF_CRITICAL_ROLE_COUNT);
    expect(health.percent).toBe(0);
    expect(health.message).toContain("Aucune couverture");
  });

  it("scores 1/3", () => {
    const health = buildStaffOrganizationalHealth(
      buildStaffMetricsFromSummary({
        ...baseSummary,
        total: 1,
        active: 1,
        super_admins: 1,
      }),
    );
    expect(health.presentRolesCount).toBe(1);
    expect(health.percent).toBe(33);
  });

  it("scores 2/3", () => {
    const health = buildStaffOrganizationalHealth(
      buildStaffMetricsFromSummary({
        ...baseSummary,
        total: 2,
        active: 2,
        super_admins: 1,
        moderators: 1,
      }),
    );
    expect(health.presentRolesCount).toBe(2);
    expect(health.percent).toBe(67);
  });

  it("scores 3/3", () => {
    const health = buildStaffOrganizationalHealth(
      buildStaffMetricsFromSummary({
        ...baseSummary,
        total: 3,
        active: 3,
        super_admins: 1,
        city_admins: 1,
        moderators: 1,
      }),
    );
    expect(health.presentRolesCount).toBe(3);
    expect(health.percent).toBe(100);
    expect(health.roles.every((role) => role.present)).toBe(true);
  });
});

describe("staffRoleFilteredEmptyMessage", () => {
  it("returns moderator-specific copy", () => {
    const message = staffRoleFilteredEmptyMessage("MODERATOR");
    expect(message.title).toContain("modérateur");
  });

  it("returns city admin-specific copy", () => {
    const message = staffRoleFilteredEmptyMessage("CITY_ADMIN");
    expect(message.title).toContain("admin ville");
  });

  it("returns super admin-specific copy", () => {
    const message = staffRoleFilteredEmptyMessage("SUPER_ADMIN");
    expect(message.title).toContain("super administrateur");
  });

  it("returns default copy", () => {
    const message = staffRoleFilteredEmptyMessage("");
    expect(message.title).toContain("critères");
  });
});

describe("staff helpers", () => {
  it("detects active filters", () => {
    expect(staffHasActiveFilters({ role: "", status: "", page: 1 })).toBe(false);
    expect(staffHasActiveFilters({ role: "MODERATOR", status: "", page: 1 })).toBe(true);
    expect(staffHasActiveFilters({ role: "", status: "suspended", page: 1 })).toBe(true);
  });

  it("builds conseil action on staff only", () => {
    expect(buildStaffConseilAction().href).toBe("/staff");
    expect(buildStaffConseilAction().ctaLabel).toBe("Voir tout le staff");
  });

  it("builds kpi cards", () => {
    const cards = buildStaffKpiCards(
      buildStaffMetricsFromSummary({
        ...baseSummary,
        total: 2,
        active: 2,
        moderators: 2,
        dominant_role: "MODERATOR",
      }),
    );
    expect(cards).toHaveLength(5);
    expect(cards.find((card) => card.id === "dominant_role")?.displayValue).toBe("Modérateur");
  });

  it("builds conseil message for suspended staff", () => {
    const message = buildStaffConseilMessage(
      buildStaffMetricsFromSummary({
        ...baseSummary,
        total: 2,
        active: 1,
        suspended: 1,
        super_admins: 2,
        city_admins: 1,
        moderators: 1,
      }),
    );
    expect(message).toContain("suspension");
  });
});
