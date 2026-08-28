import type { FeedPost, LocalVideoFeedItem } from "@yunicity/types";
import type { FeedPortalView } from "@yunicity/utils";

import {
  type FeedContextModuleFamily,
  resolveFeedContextPlacements,
} from "@/lib/feed/feed-context-stream";

/**
 * Contrat d'assemblage du flux Feed (C3-FEED-M7-R2.1).
 *
 * ── Pourquoi une union et pas une conversion ─────────────────────────────────
 * `local_videos` est structurellement INDÉPENDANTE de `posts` : aucun `post_id`,
 * aucune clé étrangère dans un sens ou dans l'autre, ses propres tables de likes,
 * commentaires et signalements. Convertir un `LocalVideoFeedItem` en `FeedPost`
 * fabriquerait un identifiant, un contrat de réactions et une date de tri qui
 * n'existent pas. L'union garde chaque donnée sous son vrai type ; seule la
 * PLACE dans le flux est décidée ici.
 *
 * ── Portée ──────────────────────────────────────────────────────────────────
 * Contrat de composition du Feed, PARTAGÉ par tous les écrans. Il ne connaît ni
 * viewport, ni breakpoint, ni classe CSS, ni composant React : il décide
 * uniquement de la séquence. Le Feed medium en est le premier consommateur ;
 * mobile et desktop l'adopteront sans réimplémenter une troisième variante.
 *
 * ── Position ─────────────────────────────────────────────────────────────────
 * Une vidéo locale est une recommandation éditoriale, pas une publication
 * chronologique : elle n'a pas de rang dans le tri backend. Sa position est donc
 * DÉTERMINISTE — après la première publication — et uniquement dans « Pour
 * vous ». `Récent` et `Populaire` trient sur des données que la vidéo ne fournit
 * pas ; l'y insérer prétendrait qu'elle satisfait ce tri.
 */

export const FEED_STREAM_VIDEO_INDEX = 1;

export type FeedStreamItem =
  | { kind: "post"; key: string; post: FeedPost }
  | { kind: "local-video"; key: string; video: LocalVideoFeedItem }
  | { kind: "context-module"; key: string; family: FeedContextModuleFamily };

/**
 * Familles reellement disponibles a cet instant. Absente ou vide, AUCUN module
 * n'est insere : le consommateur historique garde donc exactement son rendu
 * tant qu'il ne declare rien.
 */
export type BuildFeedStreamOptions = {
  availableContextFamilies?: readonly FeedContextModuleFamily[];
};

/** Modules contextuels retirés du flux desktop (≥1280px). */
export const FEED_DESKTOP_EXCLUDED_CONTEXT_FAMILIES: readonly FeedContextModuleFamily[] = [
  "must-see",
  "local-privilege",
  "tribes",
  "local-now",
];

export function filterFeedContextFamiliesForDesktop(
  families: readonly FeedContextModuleFamily[],
): FeedContextModuleFamily[] {
  return families.filter((family) => !FEED_DESKTOP_EXCLUDED_CONTEXT_FAMILIES.includes(family));
}

/** Un contenu REEL : publication ou video locale. Un module n'en est jamais un. */
function estContenuReel(item: FeedStreamItem): boolean {
  return item.kind !== "context-module";
}

/**
 * Construit la séquence du flux.
 *
 * La fonction est PURE et travaille sur la liste complète : la rejouer après un
 * « charger plus » réinsère la vidéo au même rang unique, jamais une fois par
 * page.
 */
export function buildFeedStream(
  posts: readonly FeedPost[],
  video: LocalVideoFeedItem | null,
  view: FeedPortalView,
  options: BuildFeedStreamOptions = {},
): FeedStreamItem[] {
  const flux: FeedStreamItem[] = posts.map((post) => ({
    kind: "post",
    key: `post-${post.id}`,
    post,
  }));

  if (view !== "for_you") return flux;

  if (video) {
    const index = Math.min(FEED_STREAM_VIDEO_INDEX, flux.length);
    flux.splice(index, 0, { kind: "local-video", key: `local-video-${video.id}`, video });
  }

  return insererModulesContextuels(flux, options.availableContextFamilies ?? []);
}

/**
 * Intercale les modules aux positions dues.
 *
 * Le comptage porte sur les contenus REELS deja emis : un module ne se compte
 * pas lui-meme, sinon chaque insertion decalerait la suivante. Les positions
 * etant absolues et strictement croissantes, rejouer la fonction sur une liste
 * allongee laisse les modules deja poses exactement ou ils etaient.
 */
function insererModulesContextuels(
  flux: readonly FeedStreamItem[],
  available: readonly FeedContextModuleFamily[],
): FeedStreamItem[] {
  const placements = resolveFeedContextPlacements(available);
  if (placements.length === 0) return [...flux];

  const sortie: FeedStreamItem[] = [];
  let contenusReels = 0;
  let prochain = 0;

  for (const item of flux) {
    sortie.push(item);
    if (estContenuReel(item)) contenusReels += 1;

    const placement = placements[prochain];
    // Un seul module par position : deux  ne peuvent pas se
    // suivre, meme si la liste des placements grandissait un jour.
    if (placement && placement.afterRealContentCount === contenusReels) {
      sortie.push({
        kind: "context-module",
        key: `context-${placement.family}`,
        family: placement.family,
      });
      prochain += 1;
    }
  }

  return sortie;
}

/** Nombre d'entrées vidéo du flux — sert à prouver l'absence de doublon. */
export function countStreamVideos(flux: readonly FeedStreamItem[]): number {
  return flux.filter((item) => item.kind === "local-video").length;
}

/** Nombre de modules contextuels — sert à prouver l'unicité par famille. */
export function countStreamModules(flux: readonly FeedStreamItem[]): number {
  return flux.filter((item) => item.kind === "context-module").length;
}
