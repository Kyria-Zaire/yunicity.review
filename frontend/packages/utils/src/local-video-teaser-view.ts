import type { LocalVideoFeedItem, NeighborhoodDetailVideoItem } from "@yunicity/types";

import {
  buildLocalVideoTeaserHref,
  formatLocalVideoDuration,
  resolveLocalVideoTeaserTitle,
} from "./local-video-teaser";
import { formatLocalVideoTypeLabel, formatVideoAuthorDisplayName } from "./local-video-presenter";

/**
 * Vue commune du teaser vidéo territorial (VIDEO-03).
 *
 * Deux contrats serveur différents alimentent le même teaser : le feed
 * (`LocalVideoFeedItem`, utilisé par la carte et les fiches lieu/événement) et
 * le détail quartier (`NeighborhoodDetailVideoItem`, déjà présent dans la
 * charge utile de la fiche quartier — donc sans requête supplémentaire).
 * Plutôt que de dupliquer la carte pour chaque forme, les deux sont ramenées
 * ici à une seule vue : un composant, une DA, deux sources.
 */
export const LOCAL_VIDEO_TEASER_GO_THERE = "Y aller";

export interface LocalVideoTeaserDestination {
  href: string;
  label: string;
}

export interface LocalVideoTeaserView {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  neighborhoodName: string;
  authorName: string;
  typeLabel: string;
  /** Deep-link vers la vidéo précise dans /videos. */
  href: string;
  /** Cible « Y aller » — `null` dès qu'aucune route réelle n'existe. */
  destination: LocalVideoTeaserDestination | null;
}

/** Champs de rattachement partagés par les deux contrats serveur. */
export interface LocalVideoTeaserLinks {
  cultural_place_slug: string | null;
  cultural_place_name: string | null;
  local_event_id: string | null;
}

/**
 * Cible du CTA « Y aller ».
 *
 * Deux routes existent et deux seulement : `/places/{slug}` et `/events/{id}`.
 * Le lieu passe devant l'événement quand les deux sont liés — c'est la
 * destination physique, celle où l'on « va ».
 *
 * Un nom de lieu SANS slug ne donne aucune route : on masque le CTA au lieu de
 * deviner un slug. Mieux vaut pas de bouton qu'un bouton qui mène à un 404.
 */
export function resolveLocalVideoTeaserDestination(
  links: LocalVideoTeaserLinks,
): LocalVideoTeaserDestination | null {
  const placeSlug = links.cultural_place_slug?.trim();
  if (placeSlug) {
    return {
      href: `/places/${encodeURIComponent(placeSlug)}`,
      label: LOCAL_VIDEO_TEASER_GO_THERE,
    };
  }
  const eventId = links.local_event_id?.trim();
  if (eventId) {
    return {
      href: `/events/${encodeURIComponent(eventId)}`,
      label: LOCAL_VIDEO_TEASER_GO_THERE,
    };
  }
  return null;
}

export function buildLocalVideoTeaserViewFromFeedItem(
  item: LocalVideoFeedItem,
): LocalVideoTeaserView {
  return {
    id: item.id,
    title: resolveLocalVideoTeaserTitle(item),
    thumbnailUrl: item.thumbnail_url,
    duration: formatLocalVideoDuration(item.duration_seconds),
    neighborhoodName: item.neighborhood_name,
    authorName: formatVideoAuthorDisplayName(item),
    typeLabel: formatLocalVideoTypeLabel(item.video_type),
    href: buildLocalVideoTeaserHref(item.id),
    destination: resolveLocalVideoTeaserDestination(item),
  };
}

/**
 * Le détail quartier ne répète pas le nom du quartier sur chaque vidéo — il est
 * déjà celui de la page. On le passe donc explicitement, plutôt que de le
 * déduire du slug : reconstruire un nom depuis un slug côté frontend, ce serait
 * inventer un rattachement territorial.
 */
export function buildLocalVideoTeaserViewFromNeighborhoodVideo(
  item: NeighborhoodDetailVideoItem,
  neighborhoodName: string,
): LocalVideoTeaserView {
  const title =
    item.title?.trim() || item.cultural_place_name?.trim() || "Vidéo locale";
  return {
    id: item.id,
    title,
    thumbnailUrl: item.thumbnail_url,
    duration: formatLocalVideoDuration(item.duration_seconds),
    neighborhoodName,
    authorName: formatVideoAuthorDisplayName({ author: item.author }),
    typeLabel: formatLocalVideoTypeLabel(item.video_type),
    href: buildLocalVideoTeaserHref(item.id),
    destination: resolveLocalVideoTeaserDestination(item),
  };
}
