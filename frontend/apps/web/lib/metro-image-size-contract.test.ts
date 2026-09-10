import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * SEC-FE-04A — image-size supprime, pas ignore.
 *
 * `GHSA-5p2g-fcmc-qvqq` (JXL/HEIF) et `GHSA-w3rx-r6r6-pgpr` (ICNS), CVSS 8.7 chacun,
 * venaient d'`image-size@1.2.1` tire par `metro@0.83.3`. Aucune version d'image-size
 * ne les corrige. Metro, lui, a internalise ses parseurs a partir de 0.83.8 et ne
 * depend plus du paquet : la surface disparait au lieu d'etre toleree.
 *
 * Ce contrat existe parce que la remediation tient a un override, et qu'AUCUNE CI ne
 * construit `apps/mobile` — une regression de dependance passerait donc inapercue
 * jusqu'au prochain build mobile, ou jusqu'a l'expiration d'une exception qui n'existe
 * plus. Chaque assertion ci-dessous a echoue au moins une fois pendant SEC-FE-04A.
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const racine = `${here}../../../`;
const packageJson = JSON.parse(readFileSync(`${racine}package.json`, "utf-8")) as {
  pnpm?: { overrides?: Record<string, string> };
};
const lockfile = readFileSync(`${racine}pnpm-lock.yaml`, "utf-8");
const overrides = packageJson.pnpm?.overrides ?? {};

/** Famille metro publiee d'un seul tenant : Expo les epingle toutes a la meme version. */
const FAMILLE_METRO = [
  "metro",
  "metro-babel-transformer",
  "metro-cache",
  "metro-cache-key",
  "metro-config",
  "metro-core",
  "metro-file-map",
  "metro-minify-terser",
  "metro-resolver",
  "metro-runtime",
  "metro-source-map",
  "metro-symbolicate",
  "metro-transform-plugins",
  "metro-transform-worker",
] as const;

describe("SEC-FE-04A — image-size hors de l'arbre de dependances", () => {
  it("n'apparait plus nulle part dans le lockfile", () => {
    // La preuve qui compte : ni entree de paquet, ni arete de dependance.
    expect(lockfile, "image-size est revenu dans le lockfile").not.toMatch(/(^|\s)image-size@/);
    expect(lockfile).not.toMatch(/^\s+image-size:\s/m);
  });

  it("ne laisse subsister aucune version de metro anterieure a 0.83.8", () => {
    const anciennes = [...lockfile.matchAll(/^ {2}(metro[a-z-]*)@0\.83\.([0-7])\b/gm)].map(
      (m) => `${m[1]}@0.83.${m[2]}`,
    );
    expect(anciennes, `versions vulnerables encore verrouillees : ${anciennes.join(", ")}`).toEqual(
      [],
    );
    expect(lockfile, "metro 0.83.8 absent").toMatch(/^ {2}metro@0\.83\.8:/m);
  });
});

describe("SEC-FE-04A — l'override reste borne", () => {
  it("cible la famille 0.83 par plage, jamais globalement", () => {
    for (const paquet of FAMILLE_METRO) {
      const cle = `${paquet}@<0.83.8`;
      expect(overrides[cle], `override manquant pour ${paquet}`).toBe("0.83.8");
      // Un override sans borne de version ecraserait AUSSI la famille 0.84.
      expect(overrides[paquet], `override global interdit sur ${paquet}`).toBeUndefined();
    }
  });

  it("laisse la famille 0.84 intacte", () => {
    // metro@0.84.6 est tire par @react-native/metro-config et n'a jamais eu le defaut.
    expect(lockfile, "metro 0.84.6 a ete emporte par l'override").toMatch(/^ {2}metro@0\.84\.6:/m);
  });
});

describe("SEC-FE-04A — garde contre une derive silencieuse", () => {
  it("signale tout changement de @expo/metro, qui invaliderait la validation", () => {
    // L'override a ete valide contre @expo/metro@54.2.0 par un export Expo REEL
    // (Android et iOS, avec l'asset du depot). Aucune CI ne rejoue ce bundling : si
    // cette version bouge, la compatibilite metro doit etre revalidee a la main.
    const versions = [...lockfile.matchAll(/^ {2}'?@expo\/metro'?@([0-9.]+)/gm)].map((m) => m[1]);
    expect(versions.length, "@expo/metro introuvable dans le lockfile").toBeGreaterThan(0);
    expect(
      [...new Set(versions)],
      "@expo/metro a change : rejouer `npx expo export --platform android` et `--platform ios` " +
        "depuis apps/mobile avant d'accepter ce lockfile (SEC-FE-04A).",
    ).toEqual(["54.2.0"]);
  });

  it("ne reintroduit pas d'exception osv pour image-size", () => {
    const osv = readFileSync(`${racine}osv-scanner.toml`, "utf-8");
    // On vise les entrees `id = "..."`, pas les mentions : le commentaire qui
    // explique POURQUOI ces avis ont disparu les cite legitimement.
    const ignores = [...osv.matchAll(/^id = "([^"]+)"/gm)].map((m) => m[1]);
    for (const avis of ["GHSA-5p2g-fcmc-qvqq", "GHSA-w3rx-r6r6-pgpr"]) {
      expect(ignores, `${avis} ne doit plus etre ignore : la dependance a disparu`).not.toContain(
        avis,
      );
    }
    // uuid reste traite separement (SEC-FE-04B) : ne pas le retirer par megarde.
    expect(ignores, "l'exception uuid a disparu par effet de bord").toContain(
      "GHSA-w5hq-g745-h8pq",
    );
  });
});
