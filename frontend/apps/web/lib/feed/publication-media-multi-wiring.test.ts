import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * MEDIA-MULTI-PHOTO-01 — verrous de PÉRIMÈTRE.
 *
 * Les tests de comportement montent les surfaces et comptent les résolutions.
 * Ils ne disent rien de ce qui ne doit PAS bouger : la famille ÉVÉNEMENT, la
 * famille OFFRE et la carte ORGANISATION restent hors de ce ticket — décision
 * de Kyria, « ne pas étendre la grille aux événements et offres ».
 *
 * Or les étendre ne produirait AUCUNE erreur de type : `mediaUrls` est
 * optionnel partout. Seul un verrou lu sur le texte source tient cette
 * frontière.
 *
 * ⛔ Ce fichier ne lit QUE des sources frontend. Le contrat du fil — ordre,
 * dédoublonnage, `media_url` conservé, aucun repli fabriqué — est éprouvé par
 * `backend/tests/test_feed.py`, PAR LE COMPORTEMENT. Le vérifier une seconde
 * fois ici, par une expression régulière sur du Python, coûterait plus que ça
 * ne protège : la suite vitest ne tourne qu'au déclencheur `frontend/**`, si
 * bien qu'un changement BACKEND seul casserait ce verrou sans qu'aucun job du
 * dépôt ne le joue.
 */

const read = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf-8");

const CITIZEN_CARD = read("../../components/feed/citizen-post-card.tsx");
const EVENT_CARD = read("../../components/events/event-feed-card.tsx");
const ORGANIZATION_CARD = read("../../components/feed/organization-post-card.tsx");
const PROFILE_PUBLICATIONS = read(
  "../../components/profile/desktop/profile-desktop-publications.tsx",
);

describe("frontière de périmètre", () => {
  it("1 — SEULE la carte citoyenne passe la liste", () => {
    expect(CITIZEN_CARD).toMatch(/mediaUrls=\{post\.media_urls\?\.map/);

    for (const [name, source] of [
      ["carte événement", EVENT_CARD],
      ["carte organisation", ORGANIZATION_CARD],
    ] as const) {
      expect(source, `${name} reçoit la grille — hors périmètre`).not.toContain("mediaUrls");
    }
  });

  it("2 — le profil ne rend la grille que sur un lot de PHOTOS SEULES", () => {
    // Deux contraintes tiennent dans ce seul seuil. « Aucun changement global
    // de présentation mono-photo » : sans lui, la vignette carrée du profil
    // serait remplacée par la grille du fil sur TOUTES les publications. Et
    // « aucun nouveau rendu vidéo » : la présentation d'origine du profil ne
    // rendait jamais de vidéo, un lot mixte doit donc la conserver.
    expect(PROFILE_PUBLICATIONS).toMatch(/medias\.length > 1 &&/);
    expect(PROFILE_PUBLICATIONS).toMatch(/media\.media_type === "image" && !isVideoMediaUrl/);
    expect(PROFILE_PUBLICATIONS).toMatch(/\{isPhotoLot \?/);
    // Et les deux rendus d'origine survivent dans la branche basse.
    expect(PROFILE_PUBLICATIONS).toMatch(/variant="compact"/);
    expect(PROFILE_PUBLICATIONS).toMatch(/variant="thumbnail"/);
  });
});
