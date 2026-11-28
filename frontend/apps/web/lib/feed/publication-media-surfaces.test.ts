import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

/**
 * MEDIA-02 — inventaire des surfaces de publication (PHASE 7).
 *
 * Une carte qui affiche `post.media_url` avec ses propres règles de hauteur
 * rouvre exactement le défaut corrigé : une photo portrait qui mange l'écran.
 * Ce contrat interdit la divergence à la source plutôt qu'au cas par cas — un
 * nouveau composant qui oublierait le cadre canonique fera échouer ce test.
 */

const racine = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const composants = join(racine, "components");
const depot = join(racine, "..", "..", "..");
const execFileAsync = promisify(execFile);

async function fichiersTsxAvecMediaUrl(): Promise<string[]> {
  // Git maintient déjà l'inventaire déterministe des sources actives. Son grep
  // natif évite de lire les quelque 1 070 composants dans le processus Vitest,
  // tout en incluant automatiquement toute nouvelle surface suivie par Git.
  const { stdout } = await execFileAsync(
    "git",
    ["grep", "-l", "-e", "media_url", "--", ":(glob)frontend/apps/web/components/**/*.tsx"],
    { cwd: depot, encoding: "utf8" },
  );
  return stdout
    .trim()
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((chemin) => join(depot, chemin));
}

/** Marque une utilisation du cadre canonique, directe ou par composant dédié. */
const CANONIQUES = [
  "PublicationMediaFrame",
  "PublicationMediaGrid",
  "FeedPublicationMedia",
  // Canonique UNIQUEMENT parce qu'il encadre lui-meme — verifie ci-dessous.
  "AuthorizedPostImage",
];

/**
 * Médias explicitement HORS périmètre publication, avec leur raison.
 * Toute entrée ici est une décision, pas un oubli.
 */
const EXCLUSIONS: Array<{ motif: RegExp; raison: string }> = [
  { motif: /avatar|logo_url|ProfileAvatar|AvatarImage/i, raison: "avatar / logo, pas un média de publication" },
  { motif: /stor(y|ies)/i, raison: "Story — pipeline distinct (STORY-MEDIA-DELIVERY-01)" },
  { motif: /discussion/i, raison: "discussions — pipeline distinct, hors MEDIA-02" },
  { motif: /composer|new-post|new-discussion/i, raison: "composer — aperçu local, variante dédiée" },
  {
    motif: /^videos\//,
    raison: "lecteur vidéo dédié (fil vertical) — pipeline distinct, exclu du périmètre MEDIA-02",
  },
];

function estExclu(chemin: string): string | null {
  for (const { motif, raison } of EXCLUSIONS) {
    if (motif.test(chemin)) return raison;
  }
  return null;
}

describe("MEDIA-02 — toute surface de publication passe par le cadre canonique", () => {
  it("aucune surface active hors du cadre canonique", async () => {
    const horsCadre: string[] = [];
    const exclues: string[] = [];

    // Le périmètre reste exhaustif pour les composants Web suivis. Seules les
    // surfaces candidates sont ensuite lues, sans I/O synchrone dans Vitest.
    const chemins = await fichiersTsxAvecMediaUrl();
    const sources = await Promise.all(
      chemins.map(async (chemin) => ({ chemin, source: await readFile(chemin, "utf8") })),
    );

    for (const { chemin, source } of sources) {
      // Une surface de publication = elle REND le média, pas seulement le champ.
      // Un écran de gestion qui manipule `media_url` dans un formulaire
      // n'affiche rien : le compter produirait un faux positif permanent.
      if (!/\bmedia_url\b/.test(source)) continue;
      const rendLeMedia =
        /<img\b|<video\b|CulturalImage|AuthorizedPostImage|FeedPublicationMedia|PublicationMediaFrame|PublicationMediaGrid/.test(
          source,
        );
      if (!rendLeMedia) continue;

      const relatif = chemin.slice(composants.length + 1).replace(/\\/g, "/");
      const raison = estExclu(relatif);
      if (raison) {
        exclues.push(`${relatif} — ${raison}`);
        continue;
      }
      if (!CANONIQUES.some((nom) => source.includes(nom))) {
        horsCadre.push(relatif);
      }
    }

    // Capture non vide : si le balayage ne trouvait plus rien, l'assertion
    // d'absence serait vraie pour la mauvaise raison.
    expect(exclues.length + horsCadre.length, "aucune surface analysée").toBeGreaterThan(0);
    expect(horsCadre, "surfaces de publication hors cadre canonique").toEqual([]);
  });

  it("AuthorizedPostImage encadre lui-même — sinon il ne vaut rien comme garantie", async () => {
    // Le compter parmi les primitives n'a de sens que s'il applique le cadre :
    // sinon le balayage ci-dessus déclarerait conformes des cartes qui ne le
    // sont pas.
    const source = await readFile(join(composants, "feed/authorized-post-image.tsx"), "utf8");
    expect(source).toContain("PublicationMediaFrame");
  });

  it("les cinq surfaces raccordées déclarent bien une variante canonique", async () => {
    const attendues: Array<[string, string]> = [
      ["profile/desktop/profile-desktop-publications.tsx", "AuthorizedPostImage"],
      ["tribes/mobile/tribe-detail-mobile-post-card.tsx", "AuthorizedPostImage"],
      ["partners/partner-creator-content-card.tsx", "PublicationMediaFrame"],
      ["feed/offer-feed-card.tsx", "AuthorizedPostImage"],
      ["profile/mobile/profile-mobile-post-card.tsx", "AuthorizedPostImage"],
    ];
    for (const [relatif, primitive] of attendues) {
      const source = await readFile(join(composants, relatif), "utf8");
      expect(source, `${relatif} n'utilise pas ${primitive}`).toContain(primitive);
      expect(source, `${relatif} passe une variante`).toMatch(/variant=["{]/);
    }
  });

  it("aucune carte ne redéfinit la hauteur ou le ratio du média", async () => {
    const fautives: string[] = [];
    const cartes = [
      "profile/desktop/profile-desktop-publications.tsx",
      "tribes/mobile/tribe-detail-mobile-post-card.tsx",
      "partners/partner-creator-content-card.tsx",
      "feed/offer-feed-card.tsx",
      "profile/mobile/profile-mobile-post-card.tsx",
    ];
    for (const relatif of cartes) {
      const source = await readFile(join(composants, relatif), "utf8");
      // On ne regarde que les lignes qui portent le média de publication.
      for (const ligne of source.split("\n")) {
        if (!/AuthorizedPostImage|PublicationMediaFrame|CulturalImage|media_url/.test(ligne)) continue;
        if (/\bmax-h-|\baspect-\[|\bobject-(cover|contain|fill)\b/.test(ligne)) {
          fautives.push(`${relatif} : ${ligne.trim().slice(0, 90)}`);
        }
      }
    }
    expect(fautives, "règle de dimensionnement concurrente dans une carte").toEqual([]);
  });
});
