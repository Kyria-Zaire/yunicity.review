import { describe, expect, it } from "vitest";

import {
  WEB_CITIZEN_ACCOUNT_MENU,
  WEB_CITIZEN_DESTINATIONS,
  WEB_CITIZEN_MOBILE_BOTTOM_NAV,
  WEB_CITIZEN_NAV_PRIMARY,
  WEB_CITIZEN_SEARCH_ACCESS,
  WEB_CITIZEN_SIDEBAR_STRATEGIC,
  WEB_CITIZEN_TOP_NAV_CENTER,
  WEB_CITIZEN_TOP_NAV_UTILITY,
  isWebNavActive,
} from "./web-layout-config";

/**
 * C3.1-T2 — la Navbar V3 impose EXACTEMENT quatre destinations. Ces tests verrouillent le
 * contrat : toute réintroduction d'un cinquième onglet (Recherche, Stories, Quartiers…)
 * ou toute liste parallèle qui dériverait de la source canonique casse la suite.
 */
const EXPECTED_DESTINATIONS = ["/feed", "/videos", "/map", "/sortir"] as const;

describe("Destinations canoniques", () => {
  it("expose exactement quatre destinations, dans l'ordre de la maquette V3", () => {
    expect(WEB_CITIZEN_DESTINATIONS.map((item) => item.href)).toEqual([...EXPECTED_DESTINATIONS]);
  });

  it("porte les libellés produit attendus", () => {
    expect(WEB_CITIZEN_DESTINATIONS.map((item) => item.label)).toEqual([
      "Fil local",
      "Vidéos",
      "Carte",
      "Sortir",
    ]);
  });

  it("n'expose aucune entrée Recherche parmi les destinations", () => {
    expect(WEB_CITIZEN_DESTINATIONS.some((item) => item.href.startsWith("/search"))).toBe(false);
  });

  it("n'expose aucune entrée Stories parmi les destinations", () => {
    expect(WEB_CITIZEN_DESTINATIONS.some((item) => item.href.startsWith("/stories"))).toBe(false);
  });

  it("définit chaque route une seule fois", () => {
    const hrefs = WEB_CITIZEN_DESTINATIONS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("définit une icône et une stratégie d'activation pour chaque destination", () => {
    for (const item of WEB_CITIZEN_DESTINATIONS) {
      expect(item.icon, item.href).toBeTruthy();
      expect(item.match, item.href).toBe("prefix");
    }
  });
});

describe("Aucune liste parallèle ne peut diverger", () => {
  it("la bottom-nav mobile dérive de la source canonique", () => {
    expect(WEB_CITIZEN_MOBILE_BOTTOM_NAV).toEqual([...WEB_CITIZEN_DESTINATIONS]);
  });

  it("le rail medium / desktop dérive de la source canonique", () => {
    expect(WEB_CITIZEN_SIDEBAR_STRATEGIC).toEqual([...WEB_CITIZEN_DESTINATIONS]);
  });

  it("les onglets centraux de la top-nav dérivent de la source canonique", () => {
    expect(WEB_CITIZEN_TOP_NAV_CENTER).toEqual([...WEB_CITIZEN_DESTINATIONS]);
  });

  it("l'alias legacy NAV_PRIMARY dérive de la source canonique", () => {
    expect(WEB_CITIZEN_NAV_PRIMARY).toEqual([...WEB_CITIZEN_DESTINATIONS]);
  });
});

describe("Accès Recherche — fonction stratégique, pas une destination", () => {
  it("cible /search et n'appartient pas aux destinations", () => {
    expect(WEB_CITIZEN_SEARCH_ACCESS.href).toBe("/search");
    expect(WEB_CITIZEN_DESTINATIONS).not.toContainEqual(WEB_CITIZEN_SEARCH_ACCESS);
  });

  it("est libellé « Explorer Reims » (vocabulaire Navbar V3)", () => {
    expect(WEB_CITIZEN_SEARCH_ACCESS.label).toBe("Explorer Reims");
  });
});

describe("Menu Profil — C3.1-R1", () => {
  it("conserve Profil et Paramètres, sans Passport", () => {
    const labels = WEB_CITIZEN_ACCOUNT_MENU.map((item) => item.label);
    expect(labels).toEqual(["Profil", "Paramètres"]);
    expect(WEB_CITIZEN_ACCOUNT_MENU.map((item) => item.href)).toEqual(["/profile/me", "/settings"]);
    for (const forbidden of ["Passport", "Notifications", "Discussions"] as const) {
      expect(labels).not.toContain(forbidden);
    }
  });

  it("ne retire pas les Notifications du header desktop", () => {
    expect(WEB_CITIZEN_TOP_NAV_UTILITY.map((item) => item.href)).toEqual(["/notifications"]);
  });
});

describe("État actif", () => {
  const [feed, videos, map, sortir] = WEB_CITIZEN_DESTINATIONS;

  it("active la destination exacte", () => {
    expect(isWebNavActive("/feed", feed!)).toBe(true);
    expect(isWebNavActive("/map", map!)).toBe(true);
  });

  it("active la destination sur ses sous-routes", () => {
    expect(isWebNavActive("/feed/new", feed!)).toBe(true);
    expect(isWebNavActive("/videos/new", videos!)).toBe(true);
  });

  it("garde Vidéos actif sur un deep-link ?video= (la query ne change pas le pathname)", () => {
    expect(isWebNavActive("/videos", videos!)).toBe(true);
  });

  it("n'active pas une destination sur un préfixe partiel trompeur", () => {
    expect(isWebNavActive("/feedback", feed!)).toBe(false);
    expect(isWebNavActive("/mapping", map!)).toBe(false);
  });

  it("ne rend pas Sortir actif sur le détail événement (/events/[id] n'est pas canonique)", () => {
    expect(isWebNavActive("/events/42", sortir!)).toBe(false);
    expect(isWebNavActive("/events", sortir!)).toBe(false);
  });

  it("n'active aucune destination sur la recherche", () => {
    for (const item of WEB_CITIZEN_DESTINATIONS) {
      expect(isWebNavActive("/search", item), item.href).toBe(false);
    }
  });

  it("n'active aucune destination sur les Stories", () => {
    for (const item of WEB_CITIZEN_DESTINATIONS) {
      expect(isWebNavActive("/stories", item), item.href).toBe(false);
    }
  });
});
