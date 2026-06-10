import { describe, expect, it } from "vitest";

import {
  getVisibleSidebarNavLabels,
  shouldShowPartnerNavBlock,
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
