/**
 * FEED-NEW-UX-01 — état d'un média de brouillon, hors React.
 *
 * Extrait de `use-new-post-draft` pour deux raisons : le hook dépassait la
 * limite de taille du projet, et cette logique — tri d'une sélection, statut
 * d'un média, réordonnancement — se teste sans monter de composant.
 */

import {
  COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
  POST_MEDIA_MAX_COUNT,
  POST_NEW_INVALID_TYPE,
  POST_NEW_MAX_REACHED,
  POST_NEW_TOO_LARGE,
  STORIES_MEDIA_MAX_MB,
  composerMediaKindFromMetadata,
} from "@yunicity/utils";

/**
 * Statut d'un média DANS LE BROUILLON — distinct d'un fichier refusé à la
 * sélection, qui n'entre jamais dans le brouillon (voir `RejectedFile`).
 */
export type MediaDraftStatus =
  | { kind: "selected" }
  | { kind: "uploading" }
  | { kind: "uploaded"; url: string; mediaType: "image" | "video" }
  | { kind: "failed"; reason: string };

export type MediaDraft = {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: "image" | "video";
  status: MediaDraftStatus;
};

/** Fichier écarté À LA SÉLECTION, avec son motif — jamais anonyme. */
export type RejectedFile = { name: string; reason: string };

/** Limite de taille, alignée sur le backend (20 Mo), jamais réécrite en dur. */
const MAX_BYTES = STORIES_MEDIA_MAX_MB * 1024 * 1024;

/**
 * Identité d'un média de brouillon. Un compteur monotone suffit et ne peut pas
 * collisionner, là où `Date.now()` seul rendait le même identifiant à plusieurs
 * fichiers choisis dans le même tick.
 */
let sequence = 0;
export function newMediaId(): string {
  sequence += 1;
  return `media-${sequence}`;
}

/**
 * Trie une sélection : ce qui entre dans le brouillon, et ce qui est écarté.
 *
 * ⛔ Aucun `break` : un plafond atteint ne doit pas faire disparaître
 * silencieusement les fichiers suivants — ils sont nommés eux aussi.
 * ⛔ Aucun filtre sur la nature du média : photo et vidéo cohabitent, le format
 * de la publication se DÉDUIT du lot (voir `deducePostFormat`).
 */
export function collectMediaDrafts(
  files: readonly File[],
  alreadySelected: number,
): { accepted: MediaDraft[]; rejected: RejectedFile[] } {
  const accepted: MediaDraft[] = [];
  const rejected: RejectedFile[] = [];

  for (const file of files) {
    if (alreadySelected + accepted.length >= POST_MEDIA_MAX_COUNT) {
      rejected.push({ name: file.name, reason: POST_NEW_MAX_REACHED(POST_MEDIA_MAX_COUNT) });
      continue;
    }
    if (file.size > MAX_BYTES) {
      rejected.push({ name: file.name, reason: POST_NEW_TOO_LARGE(STORIES_MEDIA_MAX_MB) });
      continue;
    }
    // Même contrat que les quatre autres composers : HEIC/HEIF refusé par MIME
    // ou par extension, et un type que le navigateur n'a pas renseigné est
    // tranché par l'extension plutôt que refusé — cas courant sur mobile.
    const nature = composerMediaKindFromMetadata(file);
    if (nature === "heic") {
      rejected.push({ name: file.name, reason: COMPOSER_MEDIA_HEIC_NOT_SUPPORTED });
      continue;
    }
    if (nature === "unknown") {
      rejected.push({ name: file.name, reason: POST_NEW_INVALID_TYPE });
      continue;
    }
    accepted.push({
      id: newMediaId(),
      file,
      previewUrl: URL.createObjectURL(file),
      mediaType: nature === "video" ? "video" : "image",
      status: { kind: "selected" },
    });
  }

  return { accepted, rejected };
}

/** Format de la publication, déduit du lot et jamais d'un onglet. */
export function deducePostFormat(medias: readonly MediaDraft[]): "text" | "photo" | "video" {
  if (medias.length === 0) return "text";
  return medias.some((item) => item.mediaType === "video") ? "video" : "photo";
}

export type MediaMoveDirection = "forward" | "backward" | "first";

/**
 * Déplace un média et rend sa NOUVELLE position affichée (base 1), pour
 * l'annonce `aria-live`. Un déplacement impossible rend la position inchangée.
 */
export function moveMediaDraft(
  medias: readonly MediaDraft[],
  id: string,
  direction: MediaMoveDirection,
): { medias: readonly MediaDraft[]; position: number } {
  const from = medias.findIndex((item) => item.id === id);
  if (from < 0) return { medias, position: 0 };

  const to = direction === "first" ? 0 : direction === "forward" ? from - 1 : from + 1;
  if (to < 0 || to >= medias.length) return { medias, position: from + 1 };

  const next = [...medias];
  const [moved] = next.splice(from, 1);
  if (!moved) return { medias, position: from + 1 };
  next.splice(to, 0, moved);
  return { medias: next, position: to + 1 };
}

/** Applique un statut au seul média visé ; un identifiant inconnu ne fait rien. */
export function withMediaStatus(
  medias: readonly MediaDraft[],
  id: string,
  status: MediaDraftStatus,
): MediaDraft[] {
  return medias.map((item) => (item.id === id ? { ...item, status } : item));
}
