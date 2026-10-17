import { describe, expect, it } from "vitest";

import { PARTNER_PORTAL_BASE, buildPartnerPortalOfferCreateHref } from "@yunicity/utils";

import { buildCreateHubActions, listCreateHubActionHrefs } from "./create-hub-actions";

describe("create-hub-actions", () => {
  it("n'expose aucune action visiteur", () => {
    expect(buildCreateHubActions({ isAuthenticated: false, partnerAccessStatus: "idle" })).toEqual([]);
  });

  it("expose les six actions citoyennes quand le partenaire est refusé", () => {
    expect(
      listCreateHubActionHrefs({
        isAuthenticated: true,
        partnerAccessStatus: "denied",
      }),
    ).toEqual([
      "/feed/new",
      "/stories/new",
      "/videos/new",
      "/sortir/create",
      "/tribes/create",
      "/organizations/request",
    ]);
  });

  it("ajoute le portail partenaire uniquement quand allowed", () => {
    expect(
      listCreateHubActionHrefs({
        isAuthenticated: true,
        partnerAccessStatus: "allowed",
      }),
    ).toEqual([
      "/feed/new",
      "/stories/new",
      "/videos/new",
      "/sortir/create",
      buildPartnerPortalOfferCreateHref(),
      "/tribes/create",
      "/organizations/request",
      PARTNER_PORTAL_BASE,
    ]);
  });

  it("n'ajoute pas le portail partenaire pendant idle, loading ou denied", () => {
    for (const status of ["idle", "loading", "denied"] as const) {
      expect(
        listCreateHubActionHrefs({
          isAuthenticated: true,
          partnerAccessStatus: status,
        }),
      ).not.toContain(PARTNER_PORTAL_BASE);
    }
  });

  it("n'expose aucune action soon ni Souvenir", () => {
    const serialized = JSON.stringify(
      buildCreateHubActions({ isAuthenticated: true, partnerAccessStatus: "allowed" }),
    );
    expect(serialized).not.toContain("soon");
    expect(serialized).not.toContain("Souvenir");
    expect(serialized).not.toContain("Bientôt disponible");
  });
});
