import { describe, expect, it } from "vitest";

import { PARTNER_NAV_ITEMS, STAFF_NAV_FLAT } from "@/lib/admin-nav-items";
import {
  getVisibleSidebarNavLabels,
  isStaffNavActive,
  shouldShowPartnerNavBlock,
  STAFF_NAV_LABELS,
} from "@/lib/admin-sidebar-nav";

describe("shouldShowPartnerNavBlock", () => {
  it("masque le bloc partenaire pour une session staff", () => {
    expect(shouldShowPartnerNavBlock(true)).toBe(false);
  });

  it("affiche le bloc partenaire pour une session non-staff", () => {
    expect(shouldShowPartnerNavBlock(false)).toBe(true);
  });
});

describe("getVisibleSidebarNavLabels", () => {
  it("staff : pas de libellés partenaire, Scanner Passport et Offres présents", () => {
    const { partner, staff } = getVisibleSidebarNavLabels(true);

    expect(partner).toEqual([]);
    expect(partner).not.toContain("Scanner Passport");
    expect(partner).not.toContain("Mes offres pour la ville");
    expect(staff).toContain("Scanner Passport");
    expect(staff).toContain("Offres");
  });

  it("non-staff : bloc partenaire présent, pas de navigation staff", () => {
    const { partner, staff } = getVisibleSidebarNavLabels(false);

    expect(partner).toEqual(["Scanner Passport", "Mes offres pour la ville"]);
    expect(staff).toEqual([]);
  });
});

describe("isStaffNavActive", () => {
  it("active Cockpit uniquement sur /", () => {
    expect(isStaffNavActive("/", "/")).toBe(true);
    expect(isStaffNavActive("/partners", "/")).toBe(false);
  });

  it("active Partenaires sur sous-routes organisations", () => {
    expect(isStaffNavActive("/partners", "/partners")).toBe(true);
    expect(isStaffNavActive("/partners/organizations/abc", "/partners")).toBe(true);
  });

  it("active Offres sur passport-offers", () => {
    expect(isStaffNavActive("/passport-offers", "/passport-offers")).toBe(true);
    expect(isStaffNavActive("/passport-offers/abc", "/passport-offers")).toBe(true);
  });

  it("active Créateurs sur creator-content", () => {
    expect(isStaffNavActive("/creator-content", "/creator-content")).toBe(true);
    expect(isStaffNavActive("/creator-content/abc", "/creator-content")).toBe(true);
  });

  it("active Configuration sur settings", () => {
    expect(isStaffNavActive("/settings", "/settings")).toBe(true);
  });

  it("active Activité sur activity", () => {
    expect(isStaffNavActive("/activity", "/activity")).toBe(true);
  });

  it("active Scanner Passport sur partner-scan", () => {
    expect(isStaffNavActive("/partner-scan", "/partner-scan")).toBe(true);
  });

  it("active Staff sur fiche détail", () => {
    expect(isStaffNavActive("/staff", "/staff")).toBe(true);
    expect(isStaffNavActive("/staff/user-1", "/staff")).toBe(true);
  });
});

describe("admin nav items", () => {
  it("staff flat nav expose les libellés attendus sans href mort", () => {
    expect(STAFF_NAV_FLAT.map((item) => item.label)).toEqual([...STAFF_NAV_LABELS]);
    for (const item of [...STAFF_NAV_FLAT, ...PARTNER_NAV_ITEMS]) {
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.href).not.toBe("#");
    }
  });
});
