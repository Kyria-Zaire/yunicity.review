import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { LOCAL_VIDEO_MAX_BYTES } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import { LOCAL_VIDEO_ERROR_MESSAGES } from "./local-video-errors";
import {
  localVideoUploadFileTooLarge,
  localVideoUploadPageSubtitle,
  localVideoUploadVideoHint,
} from "./local-video-labels";

/**
 * Contrat de taille des vidéos locales — PR202-VIDEO-STREAMING-UPLOAD-01.
 *
 * Le défaut corrigé était double. La limite vivait en deux endroits, un par
 * langage, libres de diverger. Et l'interface annonçait « max. 50 Mo » dans
 * quatre chaînes figées, qui auraient continué de mentir après le passage à
 * 200 Mo.
 *
 * Ce fichier lit la constante Python et la compare à celle de TypeScript. Un
 * test qui se contenterait de vérifier `=== 209_715_200` des deux côtés
 * n'attraperait rien : il faudrait le mettre à jour en même temps que la
 * divergence qu'il est censé détecter.
 */

const racine = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..", "..", "..");
const CONSTANTES_BACKEND = join(racine, "backend", "app", "core", "local_video_constants.py");

/** Lit `LOCAL_VIDEO_MAX_BYTES` dans la source Python, telle qu'elle est écrite. */
function limiteBackend(): number {
  const source = readFileSync(CONSTANTES_BACKEND, "utf8");
  const ligne = source.match(/^LOCAL_VIDEO_MAX_BYTES\s*=\s*(.+)$/m);
  const capture = ligne?.[1];
  expect(capture, "LOCAL_VIDEO_MAX_BYTES introuvable côté backend").toBeDefined();
  if (capture === undefined) throw new Error("constante backend illisible");

  const expression = (capture.split("#")[0] ?? "").trim();
  // `200 * 1024 * 1024` : on évalue le produit, sans interpréter du code
  // arbitraire — seuls des entiers et des `*` sont admis.
  expect(expression, "expression inattendue").toMatch(/^[\d_\s*]+$/);
  return expression
    .split("*")
    .map((part) => Number(part.trim().replace(/_/g, "")))
    .reduce((a, b) => a * b, 1);
}

describe("la limite de taille est la MÊME des deux côtés", () => {
  it("le frontend reprend exactement la valeur du backend", () => {
    expect(LOCAL_VIDEO_MAX_BYTES).toBe(limiteBackend());
  });

  it("et cette valeur est bien 200 Mo", () => {
    // Deux assertions distinctes : la première interdit la divergence, la
    // seconde documente la valeur attendue aujourd'hui. Changer la limite
    // demande de toucher les deux sources ET cette ligne.
    expect(limiteBackend()).toBe(200 * 1024 * 1024);
  });
});

describe("aucun libellé n'annonce une limite figée", () => {
  it("les libellés dérivent de la limite qu'on leur passe", () => {
    expect(localVideoUploadVideoHint(90, 200 * 1024 * 1024)).toContain("200 Mo");
    expect(localVideoUploadPageSubtitle(90, 200 * 1024 * 1024)).toContain("200 Mo");
    // Une limite différente doit produire un libellé différent — sinon la
    // valeur serait encore écrite en dur quelque part.
    expect(localVideoUploadVideoHint(90, 50 * 1024 * 1024)).toContain("50 Mo");
  });

  it("plus aucune mention de 50 Mo par défaut", () => {
    expect(localVideoUploadVideoHint(90)).not.toContain("50 Mo");
    expect(localVideoUploadPageSubtitle(90)).not.toContain("50 Mo");
  });

  it("l'erreur de taille dit le poids du fichier ET la limite", () => {
    const message = localVideoUploadFileTooLarge(250 * 1024 * 1024, 200 * 1024 * 1024);

    expect(message).toContain("250 Mo");
    expect(message).toContain("200 Mo");
    // Et propose une action : un refus sans issue laisse l'utilisateur bloqué.
    expect(message.toLowerCase()).toMatch(/filmez|qualité/);
  });

  it("le message du backend n'est jamais écrasé par un nombre figé", () => {
    // Le backend renvoie la taille réelle et la limite appliquée. Une entrée
    // dans la table locale les remplacerait par un texte statique.
    expect(LOCAL_VIDEO_ERROR_MESSAGES).not.toHaveProperty("LOCAL_VIDEO_TOO_LARGE");
  });
});
