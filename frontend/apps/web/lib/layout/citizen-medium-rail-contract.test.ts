import { describe, expect, it } from "vitest";

import {
  CITIZEN_MEDIUM_RAIL_CONTROLS,
  CITIZEN_MEDIUM_RAIL_CONTROL_ORDER,
  CITIZEN_MEDIUM_RAIL_DESTINATIONS,
  isCitizenMediumRailDestinationActive,
} from "@/lib/layout/citizen-medium-rail-contract";

describe("contrat du rail citoyen medium", () => {
  /**
   * C3-CITIZEN-MEDIUM-SHELL-R1D — identités stables des neuf contrôles. Les
   * preuves E2E doivent viser l'élément interactif réel, pas son texte : le
   * défaut `/videos` (bouton absent, libellé présent) passait justement à
   * travers une vérification textuelle.
   */
  it("expose les neuf identités de contrôle dans l'ordre visuel", () => {
    expect(CITIZEN_MEDIUM_RAIL_CONTROLS.map((c) => c.id)).toEqual([
      "feed",
      "videos",
      "map",
      "sortir",
      "search",
      "menu",
      "create",
      "notifications",
      "profile",
    ]);
  });

  it("dérive l'ordre des libellés depuis les identités — aucune seconde source", () => {
    expect([...CITIZEN_MEDIUM_RAIL_CONTROL_ORDER]).toEqual(
      CITIZEN_MEDIUM_RAIL_CONTROLS.map((c) => c.label),
    );
  });

  it("réutilise les identifiants de destination sans les redéfinir", () => {
    const destinations = CITIZEN_MEDIUM_RAIL_DESTINATIONS.map((d) => d.id);
    expect(CITIZEN_MEDIUM_RAIL_CONTROLS.slice(0, 4).map((c) => c.id)).toEqual(destinations);
    for (const destination of CITIZEN_MEDIUM_RAIL_DESTINATIONS) {
      const controle = CITIZEN_MEDIUM_RAIL_CONTROLS.find((c) => c.id === destination.id);
      expect(controle?.label).toBe(destination.label);
    }
  });

  it("n'expose ni identité dupliquée ni identité vide", () => {
    const ids = CITIZEN_MEDIUM_RAIL_CONTROLS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { id, label } of CITIZEN_MEDIUM_RAIL_CONTROLS) {
      expect(id).toMatch(/^[a-z][a-z-]*$/);
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });

  it("expose les neuf contrôles dans l'ordre visuel exact", () => {
    expect([...CITIZEN_MEDIUM_RAIL_CONTROL_ORDER]).toEqual([
      "Accueil",
      "Vidéos",
      "Carte",
      "Sortir",
      "Rechercher",
      "Menu",
      "Créer",
      "Notifications",
      "Profil",
    ]);
  });

  it("expose les quatre destinations principales dans l'ordre, avec leurs routes", () => {
    expect(CITIZEN_MEDIUM_RAIL_DESTINATIONS.map((d) => [d.id, d.href, d.label])).toEqual([
      ["feed", "/feed", "Accueil"],
      ["videos", "/videos", "Vidéos"],
      ["map", "/map", "Carte"],
      ["sortir", "/sortir", "Sortir"],
    ]);
  });

  it("ne duplique ni route, ni identifiant, ni libellé", () => {
    const ids = CITIZEN_MEDIUM_RAIL_DESTINATIONS.map((d) => d.id);
    const hrefs = CITIZEN_MEDIUM_RAIL_DESTINATIONS.map((d) => d.href);
    const labels = CITIZEN_MEDIUM_RAIL_DESTINATIONS.map((d) => d.label);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("réutilise les icônes Yunicity existantes, sans en inventer", () => {
    expect(CITIZEN_MEDIUM_RAIL_DESTINATIONS.map((d) => d.icon)).toEqual([
      "feed",
      "videos",
      "map",
      "sortir",
    ]);
  });

  it("rend active exactement la destination déclarée par le consommateur", () => {
    for (const destination of CITIZEN_MEDIUM_RAIL_DESTINATIONS) {
      expect(isCitizenMediumRailDestinationActive(destination.id, destination.id)).toBe(true);
      const autres = CITIZEN_MEDIUM_RAIL_DESTINATIONS.filter((d) => d.id !== destination.id);
      for (const autre of autres) {
        expect(isCitizenMediumRailDestinationActive(autre.id, destination.id)).toBe(false);
      }
    }
  });

  it("accepte l'absence de destination active sans en activer aucune", () => {
    for (const destination of CITIZEN_MEDIUM_RAIL_DESTINATIONS) {
      expect(isCitizenMediumRailDestinationActive(destination.id, undefined)).toBe(false);
    }
  });
});
