import { describe, expect, it } from "vitest";

import {
  REGISTER_DESKTOP_ACCOUNT_TYPE_IDS,
  REGISTER_DESKTOP_COPY,
  REGISTER_DESKTOP_ROUTES,
  REGISTER_DESKTOP_STEPS,
  registerCompactStepLabel,
} from "./register-desktop-contract";

describe("register-desktop-contract", () => {
  it("fixe le copy hero et le wizard desktop", () => {
    expect(REGISTER_DESKTOP_COPY.pageTitle).toBe("Créer votre compte");
    expect(REGISTER_DESKTOP_COPY.typeTitle).toBe("Vous êtes…");
    expect(REGISTER_DESKTOP_STEPS.map((step) => step.label)).toEqual([
      "Votre profil",
      "Vos informations",
      "Vérification",
      "Bienvenue",
    ]);
  });

  it("expose 5 profils desktop alignés maquette", () => {
    expect(REGISTER_DESKTOP_ACCOUNT_TYPE_IDS).toEqual([
      "citizen",
      "commerce",
      "association",
      "school",
      "other",
    ]);
  });

  it("fixe le copy compact mobile/medium", () => {
    expect(REGISTER_DESKTOP_COPY.compactHeroPrivacy).toBe(
      "Votre position exacte reste privée.",
    );
    expect(registerCompactStepLabel(1, 4)).toBe("Étape 1 sur 4");
  });

  it("pointe vers des routes publiques existantes", () => {
    expect(REGISTER_DESKTOP_ROUTES.login).toBe("/login");
    expect(REGISTER_DESKTOP_ROUTES.terms).toBe("/legal/conditions-generales");
    expect(REGISTER_DESKTOP_ROUTES.privacy).toBe("/legal/confidentialite");
  });
});
