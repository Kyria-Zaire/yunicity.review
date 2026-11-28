import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * C3-GLOBAL-REFONTE-P0-STABILIZE-01 — contrat d'ordre des hooks du détail Vidéo.
 *
 * `VideoDetailScreen` rend quatre états à retour anticipé (loading, introuvable,
 * traitement en cours, média non lisible) avant l'état chargé. Un hook déclaré
 * APRÈS l'un de ces retours change le nombre de hooks entre deux rendus du même
 * montage — `/videos?video={id}` passe de loading à loaded sans remonter le
 * composant — et React lève « Rendered more hooks than during the previous render ».
 *
 * Le runner web est en `environment: "node"` (voir `vitest.config.ts`) : monter le
 * composant demanderait jsdom + @testing-library, chantier séparé. Ce test verrouille
 * donc la propriété à la source, ce qui la rend non régressable quelle que soit la
 * transition empruntée à l'exécution.
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const source = readFileSync(`${here}../../components/videos/video-detail-screen.tsx`, "utf-8");

/** Retire commentaires et littéraux de chaîne : seul le code exécutable est analysé. */
function executableCode(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

/** Corps de `VideoDetailScreen`, à partir de sa déclaration. */
function componentBody(input: string): string {
  const start = input.indexOf("export function VideoDetailScreen(");
  expect(start, "VideoDetailScreen doit rester un export nommé").toBeGreaterThan(-1);
  return input.slice(start);
}

const HOOK_CALL = /\b(use[A-Z][A-Za-z]*)\s*\(/g;
/** Un retour anticipé est un `return (` indenté de deux espaces à l'intérieur d'un `if`. */
const EARLY_RETURN = /\n {4}return \(/;

describe("VideoDetailScreen — ordre des hooks stable sur les quatre transitions", () => {
  const body = componentBody(executableCode(source));

  it("déclare tous ses hooks avant le premier retour anticipé", () => {
    const firstEarlyReturn = body.search(EARLY_RETURN);
    expect(firstEarlyReturn, "le composant doit garder ses états à retour anticipé").toBeGreaterThan(
      -1,
    );

    const afterBranches = body.slice(firstEarlyReturn);
    const late = [...afterBranches.matchAll(HOOK_CALL)].map((match) => match[1]);

    expect(
      late,
      `hook(s) appelé(s) après un retour anticipé : ${late.join(", ")} — ` +
        "React exige un ordre d'appel identique à chaque rendu.",
    ).toEqual([]);
  });

  it("appelle le même nombre de hooks quelle que soit la branche empruntée", () => {
    const firstEarlyReturn = body.search(EARLY_RETURN);
    const beforeBranches = body.slice(0, firstEarlyReturn);
    const early = [...beforeBranches.matchAll(HOOK_CALL)].map((match) => match[1]);

    // Tous les hooks vivent dans le préambule : chaque branche en exécute autant.
    expect(early.length).toBeGreaterThan(0);
    expect(early).toEqual([
      "useRouter",
      "useVideosViewportTier",
      "useState",
      "useMemo",
      "useMemo",
      "useCallback",
      "useCallback",
      "useMemo",
    ]);
  });

  it("conserve les quatre états à retour anticipé", () => {
    expect(body, "état loading").toMatch(/if \(isLoading && !video\)/);
    expect(body, "état introuvable / vide").toMatch(/if \(!video\)/);
    expect(body, "état traitement en cours").toMatch(/if \(isLocalVideoFeedItemProcessing\(video\)\)/);
    expect(body, "état média non lisible").toMatch(
      /if \(!isLocalVideoFeedItemPlayable\(video\)\)/,
    );
  });

  it("ne monte qu'un lecteur par palier — aucun rendu simultané mobile et desktop", () => {
    // Le palier vient d'un store externe à trois valeurs, pas d'un booléen : les
    // variantes sont exclusives, jamais additives.
    expect(body).toContain("useVideosViewportTier()");
    expect(body).toMatch(/viewportTier === "mobile" \?/);
    expect(body).not.toMatch(/viewportTier !== "mobile" &&[\s\S]{0,80}viewportTier === "mobile"/);
  });
});
