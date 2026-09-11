import { describe, expect, it } from "vitest";

import {
  TURNSTILE_SCRIPT_URL,
  TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES,
  fallbackRegistrationStatus,
  isRegistrationFormUsable,
  parseRegistrationStatus,
  shouldRenderTurnstile,
} from "./registration-status";

const OUVERT_PUBLIC = {
  open: true,
  mode: "public",
  temporarily_unavailable: false,
  turnstile_required: true,
  turnstile_site_key: TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES,
  closes_at: null,
};

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
      temporarily_unavailable: false,
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

describe("isRegistrationFormUsable", () => {
  it("accepte un mode PUBLIC complètement configuré", () => {
    expect(isRegistrationFormUsable(OUVERT_PUBLIC)).toBe(true);
  });

  it("refuse quand le backend se déclare temporairement indisponible", () => {
    expect(
      isRegistrationFormUsable({ ...OUVERT_PUBLIC, temporarily_unavailable: true }),
    ).toBe(false);
  });

  it("refuse un PUBLIC sans site key plutôt que de désactiver Turnstile", () => {
    // Le piège à éviter : traiter l'absence de clé comme « pas de verification ».
    expect(
      isRegistrationFormUsable({ ...OUVERT_PUBLIC, turnstile_site_key: null }),
    ).toBe(false);
  });

  it("accepte un PILOT sans Turnstile", () => {
    expect(
      isRegistrationFormUsable({
        ...OUVERT_PUBLIC,
        mode: "pilot",
        turnstile_required: false,
        turnstile_site_key: null,
      }),
    ).toBe(true);
  });

  it("refuse quand les inscriptions sont fermées", () => {
    expect(isRegistrationFormUsable({ ...OUVERT_PUBLIC, open: false })).toBe(false);
  });
});

describe("clés et script Turnstile", () => {
  it("n'expose que des clés de test officielles, jamais une vraie", () => {
    // Les clés de test Cloudflare commencent par 1x / 2x / 3x. Une vraie site
    // key commence par 0x : sa presence ici signalerait une fuite.
    expect(TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES.startsWith("1x")).toBe(true);
    expect(TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES.startsWith("0x")).toBe(false);
  });

  it("charge le script depuis le seul hôte officiel", () => {
    expect(TURNSTILE_SCRIPT_URL.startsWith("https://challenges.cloudflare.com/")).toBe(true);
    expect(TURNSTILE_SCRIPT_URL).toContain("render=explicit");
  });
});
