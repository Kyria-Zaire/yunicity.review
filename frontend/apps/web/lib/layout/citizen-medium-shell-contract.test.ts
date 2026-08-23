import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { resolveCitizenMediumRoute } from "@/lib/layout/citizen-medium-shell-contract";

/**
 * C3-CITIZEN-MEDIUM-SHELL-R1A — politique d'eligibilite du rail citoyen.
 *
 * `WebSidebar` est le proprietaire unique du rail, mais il est aussi monte par
 * les familles organisation et partenaire : la politique doit etre explicite et
 * fail-safe, jamais deduite de la presence du composant.
 */
describe("resolveCitizenMediumRoute — destinations principales", () => {
  it.each([
    ["/feed", "feed"],
    ["/videos", "videos"],
    ["/map", "map"],
    ["/sortir", "sortir"],
  ])("%s active %s", (route, destination) => {
    expect(resolveCitizenMediumRoute(route)).toEqual({
      presentation: "rail",
      activeDestination: destination,
    });
  });

  /*
   * C3-CITIZEN-MEDIUM-SHELL-R1E — l'heritage de destination reste la regle,
   * mais il ne se demontre plus sur `/feed/new` ni `/videos/new` : ces deux
   * routes sont desormais des parcours de creation (voir la suite). On verrouille
   * donc l'heritage sur des descendants qui n'en sont pas.
   */
  it.each([
    ["/feed/tribes", "feed"],
    ["/videos/newsroom", "videos"],
    ["/map/quartier", "map"],
    ["/sortir/agenda", "sortir"],
  ])("le descendant %s herite de %s", (route, destination) => {
    expect(resolveCitizenMediumRoute(route)).toEqual({
      presentation: "rail",
      activeDestination: destination,
    });
  });

  it("ne confond pas un prefixe avec un debut de mot", () => {
    expect(resolveCitizenMediumRoute("/mapping")).toEqual({ presentation: "legacy" });
    expect(resolveCitizenMediumRoute("/feedback")).toEqual({ presentation: "legacy" });
  });
});

describe("resolveCitizenMediumRoute — routes citoyennes secondaires", () => {
  it.each([
    "/search",
    "/stories",
    "/tribes",
    "/passport",
    "/subscriptions",
    "/discussions",
    "/notifications",
    "/profile/me",
    "/neighborhoods",
    "/events",
    "/places",
    "/settings",
  ])("%s : rail present, aucune destination active", (route) => {
    const r = resolveCitizenMediumRoute(route);
    expect(r.presentation).toBe("rail");
    expect(r.activeDestination).toBeUndefined();
  });

  it.each([
    "/tribes/qa-tribu-publique",
    "/places/some-slug",
    "/neighborhoods/boulingrin",
    "/events/abc",
    "/user/xyz",
    "/profile/kyria",
  ])("la route dynamique %s reste citoyenne sans destination active", (route) => {
    const r = resolveCitizenMediumRoute(route);
    expect(r.presentation).toBe("rail");
    expect(r.activeDestination).toBeUndefined();
  });
});

describe("resolveCitizenMediumRoute — exclusions", () => {
  it.each([
    "/login",
    "/login/forgot-password",
    "/login/reset-password",
    "/register",
    "/legal/conditions-generales",
    "/legal/confidentialite",
    "/dev/api-status",
    "/protected",
  ])("%s n'affiche aucun rail", (route) => {
    expect(resolveCitizenMediumRoute(route)).toEqual({ presentation: "legacy" });
  });

  it.each([
    "/organizations/me",
    "/organizations/me/partner",
    "/organizations/me/partner/offers",
    "/organizations/me/partner/passport",
    "/organizations/request",
    "/creators",
    "/creators/abc",
    "/creator-content",
  ])("la famille non citoyenne %s est exclue, meme si elle monte WebSidebar", (route) => {
    expect(resolveCitizenMediumRoute(route)).toEqual({ presentation: "legacy" });
  });

  it("l'exclusion gagne sur toute inclusion generique", () => {
    expect(resolveCitizenMediumRoute("/organizations/me/partner/events")).toEqual({
      presentation: "legacy",
    });
  });
});

describe("resolveCitizenMediumRoute — robustesse", () => {
  it("est fail-safe sur une route inconnue", () => {
    expect(resolveCitizenMediumRoute("/route-inexistante")).toEqual({ presentation: "legacy" });
    expect(resolveCitizenMediumRoute("/")).toEqual({ presentation: "legacy" });
  });

  it("tolere null, undefined et chaine vide", () => {
    expect(resolveCitizenMediumRoute(null)).toEqual({ presentation: "legacy" });
    expect(resolveCitizenMediumRoute(undefined)).toEqual({ presentation: "legacy" });
    expect(resolveCitizenMediumRoute("")).toEqual({ presentation: "legacy" });
  });

  it("normalise slash final, query et hash", () => {
    expect(resolveCitizenMediumRoute("/feed/")).toEqual({
      presentation: "rail",
      activeDestination: "feed",
    });
    expect(resolveCitizenMediumRoute("/videos?video=abc")).toEqual({
      presentation: "rail",
      activeDestination: "videos",
    });
    expect(resolveCitizenMediumRoute("/map#zoom")).toEqual({
      presentation: "rail",
      activeDestination: "map",
    });
  });

  it("est deterministe et sans doublon de regle", () => {
    for (const route of ["/feed", "/videos", "/map", "/sortir", "/search", "/login"]) {
      const a = resolveCitizenMediumRoute(route);
      const b = resolveCitizenMediumRoute(route);
      expect(a).toEqual(b);
    }
  });
});

describe("resolveCitizenMediumRoute — contrat de module pur", () => {
  const code = readFileSync(
    fileURLToPath(new URL("./citizen-medium-shell-contract.ts", import.meta.url)),
    "utf-8",
  )
    .replace(/[/][*][\s\S]*?[*][/]/g, "")
    .replace(/[/][/].*$/gm, "");

  it("ne depend ni de `window`, ni du DOM, ni de React", () => {
    expect(code).not.toMatch(/\bwindow\b|\bdocument\b|matchMedia|from "react"/);
  });

  it("ne contient aucun breakpoint", () => {
    expect(code).not.toMatch(/\b(640|768|834|1024|1279|1280)\b|@media|min-width|max-width/);
  });
});

describe("parcours de création — presentation creation-flow (R1E / R1F)", () => {
  it("derive les parcours de creation depuis la liste existante", () => {
    for (const route of ["/feed/new", "/stories/new", "/videos/new"]) {
      expect(resolveCitizenMediumRoute(route), route).toEqual({ presentation: "creation-flow" });
    }
  });

  it("la priorite precise gagne sur le prefixe general eligible", () => {
    expect(resolveCitizenMediumRoute("/videos").presentation).toBe("rail");
    expect(resolveCitizenMediumRoute("/feed").presentation).toBe("rail");
    expect(resolveCitizenMediumRoute("/videos/new")).toEqual({ presentation: "creation-flow" });
    expect(resolveCitizenMediumRoute("/feed/new")).toEqual({ presentation: "creation-flow" });
    expect(resolveCitizenMediumRoute("/stories").presentation).toBe("rail");
    expect(resolveCitizenMediumRoute("/stories/new")).toEqual({ presentation: "creation-flow" });
  });

  it("n'exclut pas les portails ni les routes voisines", () => {
    expect(resolveCitizenMediumRoute("/videos?video=abc").presentation).toBe("rail");
    expect(resolveCitizenMediumRoute("/videos/").presentation).toBe("rail");
    expect(resolveCitizenMediumRoute("/videos/newsroom").presentation).toBe("rail");
  });
});
