import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * C3-FEED-RESPONSIVE-FINAL — le chrome citoyen ne recharge pas au remontage.
 *
 * Le routeur responsive du fil démonte réellement la vue inactive : traverser
 * 640px démonte l'en-tête mobile, donc `CitizenAccountMenu`, donc un
 * consommateur de `useCitizenChrome`. Sans garde, chaque bascule relançait
 * profil + inbox (mesuré : 2 requêtes par traversée).
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const chrome = readFileSync(`${here}../../hooks/use-citizen-chrome.ts`, "utf-8");

describe("useCitizenChrome — chargement unique par session", () => {
  it("mémorise l'utilisateur déjà chargé, pas seulement l'appel en vol", () => {
    expect(chrome).toContain("loadedForUserId");
    expect(chrome).toMatch(
      /if \(!force && loadedForUserId === user\.id && snapshot\.isReady\)/,
    );
  });

  it("réinitialise la mémoire à la déconnexion", () => {
    expect(chrome).toMatch(/if \(!user\)[\s\S]*?loadedForUserId = null;/);
  });

  it("marque l'utilisateur chargé sur succès comme sur échec", () => {
    const assignments = chrome.match(/loadedForUserId = user\.id;/g) ?? [];
    expect(assignments.length).toBe(2);
  });

  it("conserve une voie explicite de rechargement", () => {
    expect(chrome).toMatch(/const refresh = useCallback\(\(\) => load\(true\), \[load\]\)/);
    expect(chrome).toContain("return { refresh };");
  });

  it("garde le dédoublonnage des appels concurrents", () => {
    expect(chrome).toMatch(/if \(loadPromise\)[\s\S]*?await loadPromise;/);
    expect(chrome).toMatch(/finally \{[\s\S]*?loadPromise = null;/);
  });
});
