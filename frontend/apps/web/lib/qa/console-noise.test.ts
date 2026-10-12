import { describe, expect, it } from "vitest";

import { estBruitDePageHote } from "./console-noise";

/**
 * Ce filtre décide ce qu'un harnais E2E a le droit d'IGNORER. Trop large, il
 * masquerait les défauts qu'il est censé laisser passer. Les cas ci-dessous sont
 * donc la preuve exigible : la notice connue est ignorée, et une vraie erreur
 * React comme un refus CSP bloquant restent détectés.
 */
describe("estBruitDePageHote", () => {
  it("ignore la notice CSP de la page hôte, relevée telle quelle sous WebKit", () => {
    // Texte réel capturé le 12/10 pendant la spec 33 sous WebKit.
    const notice =
      "The Content Security Policy 'default-src 'self'; base-uri 'self'; " +
      "object-src 'none'; frame-ancestors 'none'; form-action 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com' " +
      "was delivered via a <meta> element outside the document's <head>.";
    expect(estBruitDePageHote(notice)).toBe(true);
  });

  it("ignore le bruit réseau de la page hôte", () => {
    expect(
      estBruitDePageHote("Failed to load resource: the server responded with a status of 401"),
    ).toBe(true);
  });

  it("DÉTECTE un refus d'exécution CSP, qui mentionne pourtant la même politique", () => {
    const refus =
      "Refused to execute a script because its hash, its nonce, or 'unsafe-inline' " +
      "does not appear in the script-src directive of the Content Security Policy.";
    expect(estBruitDePageHote(refus)).toBe(false);
  });

  it("DÉTECTE un refus de chargement CSP", () => {
    const refus =
      "Refused to load https://exemple.test/x.js because it does not appear in the " +
      "script-src directive of the Content Security Policy.";
    expect(estBruitDePageHote(refus)).toBe(false);
  });

  it("DÉTECTE une erreur React de rendu", () => {
    expect(
      estBruitDePageHote(
        "The above error occurred in the <FeedCardWithDependencies> component. " +
          "React will try to recreate this component tree from scratch.",
      ),
    ).toBe(false);
  });

  it("DÉTECTE une erreur de hook React", () => {
    expect(
      estBruitDePageHote(
        "Invalid hook call. Hooks can only be called inside of the body of a function component.",
      ),
    ).toBe(false);
  });

  it("DÉTECTE l'erreur de provider absent du harnais", () => {
    expect(estBruitDePageHote("useAuth doit être utilisé dans AuthProvider")).toBe(false);
  });

  it("ne se laisse pas tromper par une mention de CSP en milieu de message", () => {
    expect(
      estBruitDePageHote(
        "Uncaught Error: notre code a journalisé « Content Security Policy » par erreur",
      ),
    ).toBe(false);
  });
});
