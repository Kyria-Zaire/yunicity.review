import { describe, expect, it } from "vitest";

import {
  buildYunicityMenuGroups,
  flattenYunicityMenuLabels,
} from "./yunicity-menu-contract";

const EXCLUDED_LABELS = [
  "Offres et partenaires",
  "Enregistrés",
  "Mes publications",
  "Aide et support",
] as const;

describe("yunicity-menu-contract", () => {
  it("expose les entrées connectées attendues", () => {
    expect(flattenYunicityMenuLabels(buildYunicityMenuGroups({ isAuthenticated: true }))).toEqual([
      "Quartiers",
      "Tribus",
      "Lieux",
      "Passport",
      "Notifications",
      "Discussions",
      "Profil",
      "Paramètres",
      "Se déconnecter",
    ]);
  });

  it("expose les entrées visiteur attendues", () => {
    expect(flattenYunicityMenuLabels(buildYunicityMenuGroups({ isAuthenticated: false }))).toEqual([
      "Quartiers",
      "Tribus",
      "Lieux",
      "Se connecter",
      "Créer un compte",
    ]);
  });

  it("n'expose aucune entrée exclue", () => {
    const labels = [
      ...flattenYunicityMenuLabels(buildYunicityMenuGroups({ isAuthenticated: true })),
      ...flattenYunicityMenuLabels(buildYunicityMenuGroups({ isAuthenticated: false })),
    ].join(" | ");

    for (const excluded of EXCLUDED_LABELS) {
      expect(labels).not.toContain(excluded);
    }
  });

  it("garde les routes Découvrir publiques", () => {
    for (const auth of [true, false]) {
      const discover = buildYunicityMenuGroups({ isAuthenticated: auth }).find(
        (group) => group.id === "discover",
      );
      expect(discover?.items.map((item) => item.href)).toEqual([
        "/neighborhoods",
        "/tribes",
        "/places",
      ]);
    }
  });
});
