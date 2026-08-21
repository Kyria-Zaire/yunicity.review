import { describe, expect, it } from "vitest";

import {
  PUBLIC_HOME_COPY,
  PUBLIC_HOME_FORBIDDEN_COPY,
  PUBLIC_HOME_PREVIEWS,
  PUBLIC_HOME_ROUTES,
} from "./public-home-contract";

describe("public-home-contract — C3.1-R1B", () => {
  it("fixe le copy hero et les CTA exacts", () => {
    expect(PUBLIC_HOME_COPY.heroTitle).toBe("Reims, plus proche de vous.");
    expect(PUBLIC_HOME_COPY.heroBody).toBe(
      "Découvrez les quartiers, événements, lieux et communautés qui font vivre votre ville.",
    );
    expect(PUBLIC_HOME_COPY.headerLogin).toBe("Se connecter");
    expect(PUBLIC_HOME_COPY.headerRegister).toBe("Créer un compte");
    expect(PUBLIC_HOME_COPY.heroDiscover).toBe("Découvrir Reims");
    expect(PUBLIC_HOME_COPY.heroRegister).toBe("Créer mon compte");
    expect(PUBLIC_HOME_COPY.heroExistingAccount).toBe("J’ai déjà un compte");
  });

  it("pointe uniquement vers des routes publiques existantes", () => {
    expect(PUBLIC_HOME_ROUTES.login).toBe("/login");
    expect(PUBLIC_HOME_ROUTES.register).toBe("/register");
    expect(PUBLIC_HOME_ROUTES.discover).toBe("/neighborhoods");
    expect(PUBLIC_HOME_ROUTES.privacy).toBe("/legal/confidentialite");
    expect(PUBLIC_HOME_ROUTES.terms).toBe("/legal/conditions-generales");
    expect(PUBLIC_HOME_PREVIEWS.map((preview) => [preview.title, preview.href])).toEqual([
      ["Quartiers", "/neighborhoods"],
      ["Sortir à Reims", "/sortir"],
      ["Lieux", "/places"],
    ]);
  });

  it("interdit le diagnostic API sur l’accueil public", () => {
    expect(PUBLIC_HOME_FORBIDDEN_COPY).toEqual(
      expect.arrayContaining(["Statut API", "Erreur API", "Actualiser"]),
    );
  });
});
