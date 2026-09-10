import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * REGISTRATION-CONTAINMENT-01 — garde-fous de l'ecran d'inscription.
 *
 * La securite vit dans le backend (403 REGISTRATION_CLOSED, couvert par
 * pytest). Ce fichier verrouille ce que le FRONT doit tenir : annoncer la
 * fermeture au lieu de faire remplir un assistant pour rien, conserver le lien
 * de connexion et les mentions legales, et ne pas rouvrir une redirection.
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (relative: string) => readFileSync(`${here}${relative}`, "utf-8");

const ecran = read("../../components/register/register-screen.tsx");
const pied = read("../../components/register/shared/register-portal-footer.tsx");

describe("REGISTRATION-CONTAINMENT-01 — etat ferme", () => {
  it("annonce la fermeture avant de monter l'assistant", () => {
    const garde = ecran.indexOf("if (!isRegistrationEnabled())");
    const assistant = ecran.indexOf("<RegisterMobileScreen");
    expect(garde, "garde de fermeture absente").toBeGreaterThan(-1);
    expect(assistant).toBeGreaterThan(-1);
    expect(garde, "l'assistant serait monte malgre la fermeture").toBeLessThan(assistant);
  });

  it("expose un marqueur stable et les libelles partages", () => {
    expect(ecran).toContain('data-register-state="closed"');
    expect(ecran).toContain("REGISTER_CLOSED_TITLE");
    expect(ecran).toContain("REGISTER_CLOSED_BODY");
  });

  it("conserve le lien de connexion et les mentions legales", () => {
    // Reutilise le pied de page existant plutot que d'inventer une composition.
    const ferme = ecran.slice(
      ecran.indexOf("if (!isRegistrationEnabled())"),
      ecran.indexOf("if (successPath)"),
    );
    expect(ferme).toContain("<RegisterPortalFooter");
    expect(ferme).toContain("loginHref={loginHref}");
    expect(pied).toContain("REGISTER_DESKTOP_ROUTES.terms");
    expect(pied).toContain("REGISTER_DESKTOP_ROUTES.privacy");
    expect(pied).toContain("REGISTER_DESKTOP_COPY.loginLink");
  });

  it("n'ouvre aucune redirection : `next` reste interne", () => {
    // Une valeur externe (`https://ailleurs`) ne commence pas par "/" et retombe
    // donc sur "/login" sec.
    expect(ecran).toMatch(/if \(!next \|\| !next\.startsWith\("\/"\)\) return "\/login";/);
  });

  it("ne rend AUCUN champ de saisie dans l'etat ferme", () => {
    const ferme = ecran.slice(
      ecran.indexOf("if (!isRegistrationEnabled())"),
      ecran.indexOf("if (successPath)"),
    );
    expect(ferme).not.toMatch(/<input|<form|<textarea|onSubmit/);
  });
});
