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
    const groups = buildYunicityMenuGroups({ isAuthenticated: true });
    expect(groups.map((group) => group.id)).toEqual(["discover", "my-space", "exchange"]);
    expect(groups.some((group) => group.id === "account" || group.title === "Compte")).toBe(false);
    expect(flattenYunicityMenuLabels(groups)).toEqual([
      "Quartiers",
      "Tribus",
      "Lieux",
      "Passport",
      "Notifications",
      "Discussions",
    ]);
  });

  it("n'expose ni Profil, ni Paramètres, ni Déconnexion au Menu connecté", () => {
    const labels = flattenYunicityMenuLabels(buildYunicityMenuGroups({ isAuthenticated: true }));
    expect(labels).not.toContain("Profil");
    expect(labels).not.toContain("Paramètres");
    expect(labels).not.toContain("Se déconnecter");
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
