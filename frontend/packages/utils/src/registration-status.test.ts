import { describe, expect, it } from "vitest";

import {
  fallbackRegistrationStatus,
  parseRegistrationStatus,
  shouldRenderTurnstile,
} from "./registration-status";

describe("parseRegistrationStatus", () => {
  it("lit une réponse complète du backend", () => {
    const statut = parseRegistrationStatus({
      open: true,
      mode: "public",
      turnstile_required: true,
      turnstile_site_key: "0x000site",
      closes_at: null,
    });

    expect(statut).toEqual({
      open: true,
      mode: "public",
      turnstile_required: true,
      turnstile_site_key: "0x000site",
      closes_at: null,
    });
  });

  it("tolère une réponse partielle d'un backend plus ancien", () => {
    // Un champ manquant vient d'une version antérieure, pas d'une fermeture.
    const statut = parseRegistrationStatus({ open: true });
    expect(statut?.open).toBe(true);
    expect(statut?.turnstile_required).toBe(false);
    expect(statut?.turnstile_site_key).toBeNull();
  });

  it("rejette une réponse sans état exploitable", () => {
    expect(parseRegistrationStatus(null)).toBeNull();
    expect(parseRegistrationStatus("ouvert")).toBeNull();
    expect(parseRegistrationStatus({ mode: "public" })).toBeNull();
  });

  it("ne déduit jamais une fermeture d'un champ absent", () => {
    const statut = parseRegistrationStatus({ open: true, turnstile_required: undefined });
    expect(statut?.open).toBe(true);
  });
});

describe("fallbackRegistrationStatus", () => {
  it("reste ouvert quand la variable de compilation est absente", () => {
    // Fermer par défaut couperait l'inscription en développement local et sur
    // tout environnement qui ne déclare rien.
    expect(fallbackRegistrationStatus(undefined).open).toBe(true);
  });

  it("respecte une fermeture explicite", () => {
    expect(fallbackRegistrationStatus("false").open).toBe(false);
    expect(fallbackRegistrationStatus("off").open).toBe(false);
  });

  it("n'exige jamais Turnstile en repli", () => {
    // Sans réponse du backend, aucune site key n'est connue : exiger le widget
    // rendrait le formulaire impossible à soumettre.
    expect(fallbackRegistrationStatus(undefined).turnstile_required).toBe(false);
  });
});

describe("shouldRenderTurnstile", () => {
  it("monte le widget quand il est exigé et que la clé est fournie", () => {
    expect(
      shouldRenderTurnstile({
        open: true,
        mode: "public",
        turnstile_required: true,
        turnstile_site_key: "0x000site",
        closes_at: null,
      }),
    ).toBe(true);
  });

  it("ne l'exige pas sans site key, pour ne pas bloquer le formulaire", () => {
    expect(
      shouldRenderTurnstile({
        open: true,
        mode: "public",
        turnstile_required: true,
        turnstile_site_key: null,
        closes_at: null,
      }),
    ).toBe(false);
  });

  it("ne le monte pas quand le mode ne l'exige pas", () => {
    expect(
      shouldRenderTurnstile({
        open: true,
        mode: "pilot",
        turnstile_required: false,
        turnstile_site_key: "0x000site",
        closes_at: null,
      }),
    ).toBe(false);
  });
});
