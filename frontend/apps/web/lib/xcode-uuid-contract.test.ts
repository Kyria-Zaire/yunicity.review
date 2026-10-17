import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

/**
 * SEC-FE-04B — uuid remplace, pas ignore.
 *
 * `GHSA-w5hq-g745-h8pq` visait uuid@7.0.3, tire par `xcode@3.0.1`, seul dependant.
 * L'avis porte sur un defaut de borne memoire dans v3/v5/v6 QUAND un buffer est
 * fourni ; `xcode` n'appelle que `v4()`, sans argument. Aucune montee officielle
 * n'existe : xcode@3.0.1 est la derniere version publiee et toutes les lignes
 * d'@expo/config-plugins, jusqu'a la 58, l'epinglent. Un override parent-enfant
 * porte donc uuid a 11.1.1, premiere version corrigee qui conserve une entree
 * CommonJS.
 *
 * Ce contrat execute reellement la chaine — il ne lit pas des manifestes. Aucune
 * CI ne construit `apps/mobile`, et le prebuild iOS est impossible sous Windows :
 * sans ces assertions, une regression ne se verrait qu'au premier build macOS.
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const racine = `${here}../../../`;
const lockfile = readFileSync(`${racine}pnpm-lock.yaml`, "utf-8");
const overrides = (
  JSON.parse(readFileSync(`${racine}package.json`, "utf-8")) as {
    pnpm?: { overrides?: Record<string, string> };
  }
).pnpm?.overrides ?? {};

const requireDepuisIci = createRequire(import.meta.url);

/** Projet Xcode minimal mais authentique — embarque pour ne dependre d'aucune fixture. */
const PBXPROJ_MINIMAL = `// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 46;
	objects = {
		13B07F961A680F5B00A75B9A /* Products */ = {
			isa = PBXGroup;
			children = (
			);
			name = Products;
			sourceTree = "<group>";
		};
		83CBB9F71A601CBA00E9B192 /* Project object */ = {
			isa = PBXProject;
			attributes = {
				LastUpgradeCheck = 1200;
			};
			compatibilityVersion = "Xcode 3.2";
			mainGroup = 13B07F961A680F5B00A75B9A;
			productRefGroup = 13B07F961A680F5B00A75B9A /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
			);
		};
	};
	rootObject = 83CBB9F71A601CBA00E9B192 /* Project object */;
}
`;

const dossierTemporaire = mkdtempSync(join(tmpdir(), "yunicity-pbx-"));
afterAll(() => {
  // Hors du depot, et efface : aucun artefact ne subsiste.
  rmSync(dossierTemporaire, { recursive: true, force: true });
});

describe("SEC-FE-04B — uuid resolu depuis xcode", () => {
  it("expose une entree CommonJS, contrairement a ce que disait l'exception", () => {
    const chemin = requireDepuisIci.resolve("uuid");
    expect(chemin, "uuid ne resout pas vers un build CommonJS").toMatch(/dist[\\/]cjs[\\/]/);
    const version = (requireDepuisIci("uuid/package.json") as { version: string }).version;
    expect(version).toBe("11.1.1");
  });

  it("fournit v4 appelable sans argument — la seule methode utilisee par xcode", () => {
    const uuid = requireDepuisIci("uuid") as { v4: () => string };
    expect(typeof uuid.v4).toBe("function");
    expect(uuid.v4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("SEC-FE-04B — xcode produit toujours des identifiants valides", () => {
  it("generateUuid rend 24 caracteres hexadecimaux majuscules", () => {
    const xcode = requireDepuisIci("xcode") as {
      project: (chemin: string) => { generateUuid: () => string; hash: unknown };
    };
    const fichier = join(dossierTemporaire, "generate.pbxproj");
    writeFileSync(fichier, PBXPROJ_MINIMAL);
    const projet = xcode.project(fichier) as ReturnType<typeof xcode.project> & {
      parseSync: () => void;
    };
    projet.parseSync();

    const identifiants = new Set<string>();
    for (let i = 0; i < 200; i += 1) identifiants.add(projet.generateUuid());

    for (const identifiant of identifiants) {
      expect(identifiant, `format invalide : ${identifiant}`).toMatch(/^[0-9A-F]{24}$/);
    }
    // Une collision passerait inapercue jusqu'a un projet Xcode corrompu.
    expect(identifiants.size, "identifiants dupliques").toBe(200);
  });

  it("relit un .pbxproj apres reecriture, sans perte de structure", () => {
    const xcode = requireDepuisIci("xcode") as { project: (chemin: string) => never };
    const source = join(dossierTemporaire, "aller-retour.pbxproj");
    writeFileSync(source, PBXPROJ_MINIMAL);

    const projet = xcode.project(source) as unknown as {
      parseSync: () => void;
      writeSync: () => string;
      hash: { project: { rootObject: string; objects: Record<string, unknown> } };
    };
    projet.parseSync();
    expect(Object.keys(projet.hash.project.objects).length).toBeGreaterThan(0);

    const relire = (contenu: string, nom: string) => {
      const chemin = join(dossierTemporaire, nom);
      writeFileSync(chemin, contenu);
      const p = xcode.project(chemin) as unknown as {
        parseSync: () => void;
        writeSync: () => string;
        hash: { project: { rootObject: string; objects: Record<string, unknown> } };
      };
      p.parseSync();
      return p;
    };

    // `writeSync` normalise la mise en forme : le PREMIER aller-retour peut donc
    // regrouper des sections. Ce qui doit tenir, c'est l'identite du projet et la
    // stabilite a partir de la forme normalisee.
    const premier = relire(projet.writeSync(), "reecrit-1.pbxproj");
    const second = relire(premier.writeSync(), "reecrit-2.pbxproj");

    expect(premier.hash.project.rootObject).toBe(projet.hash.project.rootObject);
    expect(second.hash.project.rootObject).toBe(projet.hash.project.rootObject);
    expect(Object.keys(second.hash.project.objects).length).toBe(
      Object.keys(premier.hash.project.objects).length,
    );
  });
});

describe("SEC-FE-04B — l'override reste borne", () => {
  it("ne vise uuid que sous xcode@3.0.1", () => {
    expect(overrides["xcode@3.0.1>uuid"]).toBe("11.1.1");
    // Un override global toucherait tout dependant futur sans validation.
    expect(overrides["uuid"], "override global interdit sur uuid").toBeUndefined();
  });

  it("a fait disparaitre uuid@7.0.3 du lockfile", () => {
    expect(lockfile, "uuid@7.0.3 est revenu").not.toMatch(/(^|\s)uuid@7\.0\.3/);
    expect(lockfile, "uuid@11.1.1 absent").toMatch(/^ {2}uuid@11\.1\.1:/m);
  });

  it("signale tout changement de xcode, qui invaliderait la validation", () => {
    // xcode@3.0.1 est la derniere version publiee ; si elle bouge, la portee de
    // l'override et la compatibilite CommonJS doivent etre revalidees.
    const versions = [...lockfile.matchAll(/^ {2}xcode@([0-9.]+):/gm)].map((m) => m[1]);
    expect(
      [...new Set(versions)],
      "xcode a change : revalider `xcode@3.0.1>uuid` et rejouer les exports Expo (SEC-FE-04B).",
    ).toEqual(["3.0.1"]);
  });

  it("ne conserve aucune exception osv pour uuid", () => {
    const osv = readFileSync(`${racine}osv-scanner.toml`, "utf-8");
    const ignores = [...osv.matchAll(/^id = "([^"]+)"/gm)].map((m) => m[1]);
    expect(ignores, "GHSA-w5hq-g745-h8pq ne doit plus etre ignore").not.toContain(
      "GHSA-w5hq-g745-h8pq",
    );
  });
});
