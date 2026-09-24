import { describe, expect, it } from "vitest";

import {
  LOGIN_PORTAL_COPY,
  LOGIN_PORTAL_HERO_IMAGE,
  LOGIN_PORTAL_ROUTES,
} from "./login-portal-contract";
import { REGISTER_DESKTOP_HERO_IMAGE } from "./register-desktop-contract";

describe("login-portal-contract", () => {
  it("fixe le copy login aligné maquette register", () => {
    expect(LOGIN_PORTAL_COPY.pageTitle).toBe("Connectez-vous");
    expect(LOGIN_PORTAL_COPY.pageSubtitle).toBe("Retrouvez votre ville et vos communautés.");
    expect(LOGIN_PORTAL_COPY.noAccount).toBe("Pas encore de compte ?");
    expect(LOGIN_PORTAL_COPY.registerLink).toBe("Créer un compte");
  });

  it("réutilise le hero register", () => {
    expect(LOGIN_PORTAL_COPY.heroTitle).toBe("Votre ville, au bon moment.");
    expect(LOGIN_PORTAL_HERO_IMAGE).toBe(REGISTER_DESKTOP_HERO_IMAGE);
  });

  it("pointe vers des routes publiques existantes", () => {
    expect(LOGIN_PORTAL_ROUTES.register).toBe("/register");
    expect(LOGIN_PORTAL_ROUTES.terms).toBe("/legal/conditions-generales");
    expect(LOGIN_PORTAL_ROUTES.privacy).toBe("/legal/confidentialite");
  });
});
