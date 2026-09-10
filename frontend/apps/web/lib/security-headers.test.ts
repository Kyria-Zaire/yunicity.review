import { describe, expect, it } from "vitest";

import {
  CSP_REPORT_ONLY,
  HSTS_MAX_AGE_SECONDS,
  PERMISSIONS_POLICY,
  SECURITY_HEADERS,
} from "./security-headers";

/**
 * AIF SEC-01 — ces tests verrouillent les prudences, pas la cosmétique.
 *
 * Le risque n'est pas d'oublier un en-tête : c'est d'en poser un qu'on ne peut
 * plus retirer (HSTS agressif) ou qui casse un parcours (géolocalisation
 * refusée, CSP bloquante). Chaque test ci-dessous garde l'une de ces portes.
 */
const parNom = (nom: string) => SECURITY_HEADERS.find((h) => h.key === nom);

describe("SECURITY_HEADERS", () => {
  it("émet les six en-têtes attendus", () => {
    expect(SECURITY_HEADERS.map((h) => h.key)).toEqual([
      "Strict-Transport-Security",
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Content-Security-Policy-Report-Only",
    ]);
  });

  it("refuse le cadrage par un tiers", () => {
    expect(parNom("X-Frame-Options")?.value).toBe("DENY");
    expect(CSP_REPORT_ONLY).toContain("frame-ancestors 'none'");
  });

  it("interdit le reniflage de type", () => {
    expect(parNom("X-Content-Type-Options")?.value).toBe("nosniff");
  });

  it("ne fuit pas le chemin complet vers un tiers", () => {
    expect(parNom("Referrer-Policy")?.value).toBe("strict-origin-when-cross-origin");
  });
});

describe("HSTS — réversibilité", () => {
  // Une directive HSTS reste en cache navigateur jusqu'a expiration : la seule
  // protection contre une erreur est une duree courte.
  it("garde une durée courte", () => {
    expect(HSTS_MAX_AGE_SECONDS).toBeLessThanOrEqual(3600);
  });

  it("n'utilise ni preload ni includeSubDomains", () => {
    const valeur = parNom("Strict-Transport-Security")?.value ?? "";
    expect(valeur).toBe(`max-age=${HSTS_MAX_AGE_SECONDS}`);
    expect(valeur).not.toContain("preload");
    expect(valeur).not.toContain("includeSubDomains");
  });
});

describe("CSP — report-only", () => {
  it("est déclarée en report-only et jamais en mode bloquant", () => {
    expect(parNom("Content-Security-Policy-Report-Only")).toBeDefined();
    expect(SECURITY_HEADERS.some((h) => h.key === "Content-Security-Policy")).toBe(false);
  });

  it("autorise les origines réellement utilisées par les cartes et l'agenda", () => {
    expect(CSP_REPORT_ONLY).toContain("https://maps.googleapis.com");
    expect(CSP_REPORT_ONLY).toContain("https://www.openstreetmap.org");
    expect(CSP_REPORT_ONLY).toContain("https://calendar.google.com");
  });
});

describe("Permissions-Policy — parcours préservés", () => {
  it("laisse la géolocalisation à l'origine même", () => {
    // Le fil territorial et la carte en dependent : la refuser casserait la Beta.
    expect(PERMISSIONS_POLICY).toContain("geolocation=(self)");
  });

  it("laisse la capture vidéo à l'origine même", () => {
    expect(PERMISSIONS_POLICY).toContain("camera=(self)");
    expect(PERMISSIONS_POLICY).toContain("microphone=(self)");
  });

  it("refuse le paiement, cohérent avec Stripe désactivé", () => {
    expect(PERMISSIONS_POLICY).toContain("payment=()");
  });
});
