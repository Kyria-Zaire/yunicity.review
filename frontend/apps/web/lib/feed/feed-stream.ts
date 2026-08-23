import type { FeedPost, LocalVideoFeedItem } from "@yunicity/types";
import type { FeedPortalView } from "@yunicity/utils";

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
  | { kind: "local-video"; key: string; video: LocalVideoFeedItem };

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
): FeedStreamItem[] {
  const flux: FeedStreamItem[] = posts.map((post) => ({
    kind: "post",
    key: `post-${post.id}`,
    post,
  }));

  if (!video || view !== "for_you") return flux;

  const index = Math.min(FEED_STREAM_VIDEO_INDEX, flux.length);
  flux.splice(index, 0, { kind: "local-video", key: `local-video-${video.id}`, video });
  return flux;
}

/** Nombre d'entrées vidéo du flux — sert à prouver l'absence de doublon. */
export function countStreamVideos(flux: readonly FeedStreamItem[]): number {
  return flux.filter((item) => item.kind === "local-video").length;
}
