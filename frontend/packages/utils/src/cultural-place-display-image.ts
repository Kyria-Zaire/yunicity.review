/** Résolution d’images lieux culturels — évite le placeholder Unsplash générique répété (WEB-PLACES-01-POLISH). */

import type { CulturalPlaceListItem } from "@yunicity/types";

import {
  type CulturalPlaceImageSource,
  resolveCulturalPlaceHeroUrl,
  resolveCulturalPlaceThumbnailUrl,
} from "./cultural-place-media";

/** Minimal shape accepted by the display resolver: a slug (for overrides) plus any
 *  subset of image fields. Lets neighborhood-detail places (image_url only) reuse it. */
export type CulturalPlaceDisplaySource = Pick<CulturalPlaceListItem, "slug"> &
  CulturalPlaceImageSource &
  Partial<Pick<CulturalPlaceListItem, "gallery_images">>;

/** URL Unsplash unique utilisée comme fallback seed `_wiki()` — placeholder générique à ignorer. */
export const GENERIC_CULTURAL_UNSPLASH_PHOTO_ID = "photo-1761983084378-6d63f5e996cb";

/** Halles / marché Boulingrin — Commons stable (dev QA + seed sans CDN). */
export const CULTURAL_PLACE_BOULINGRIN_MARKET_IMAGE =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Reims_-_halles_du_Boulingrin_(04).JPG?width=1400";

const CULTURAL_PLACE_CARNEGIE_IMAGE =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Reims_-_biblioth%C3%A8que_Carnegie_%281%29.JPG?width=1400";

/**
 * Overrides d'images par slug — UNIQUEMENT pour les lieux culturels NON traités par SEED-PROD-01B.
 * Les 12 lieux servis depuis R2/CDN (`media.yunicity.city/places/reims/{slug}/cover.jpg`) ont été
 * retirés : leur source de vérité est désormais l'API `cultural_places`. Ne pas réintroduire ici
 * un slug qui possède une cover R2 officielle — l'API doit primer (cf. fix/web-cultural-covers-display).
 */
const CULTURAL_PLACE_SLUG_IMAGE_OVERRIDES: Record<string, string> = {
  "bibliotheque-carnegie": CULTURAL_PLACE_CARNEGIE_IMAGE,
  "domaine-pommery":
    "https://images.unsplash.com/photo-1510812431401-41d2bd2724f3?auto=format&fit=crop&w=900&q=80",
  "place-royale":
    "https://images.unsplash.com/photo-1467269209834-ffaff5f779eb?auto=format&fit=crop&w=900&q=80",
  "place-erlon":
    "https://images.unsplash.com/photo-1449824913935-59a10b85d9bf?auto=format&fit=crop&w=900&q=80",
  "villa-demoiselle":
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80",
  "marche-du-boulingrin": CULTURAL_PLACE_BOULINGRIN_MARKET_IMAGE,
};

/** Fallback éditorial quand l'API ne sert que le placeholder générique ou rien (dev / QA). */
const CULTURAL_PLACE_SLUG_EDITORIAL_FALLBACKS: Record<string, string> = {
  "halles-boulingrin": CULTURAL_PLACE_BOULINGRIN_MARKET_IMAGE,
  "marche-du-boulingrin": CULTURAL_PLACE_BOULINGRIN_MARKET_IMAGE,
};

const CULTURAL_PLACE_SLUG_IMAGE_ALIASES: Record<string, string> = {
  "marche-du-boulingrin": "halles-boulingrin",
};

export type CulturalPlaceImageVariant = "hero" | "thumbnail";

export function isGenericCulturalPlaceholderUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  return trimmed.includes(GENERIC_CULTURAL_UNSPLASH_PHOTO_ID);
}

/** Hôtes ou URLs connus pour échouer côté navigateur (hotlink, expiration). */
export function isUnreliableCulturalImageUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  if (isGenericCulturalPlaceholderUrl(trimmed)) return true;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return host.endsWith(".bing.net") || host === "bing.net";
  } catch {
    return false;
  }
}

export function resolveCulturalPlaceSlugImageOverride(
  slug: string,
): string | null {
  const direct = CULTURAL_PLACE_SLUG_IMAGE_OVERRIDES[slug];
  if (direct) return direct;
  const alias = CULTURAL_PLACE_SLUG_IMAGE_ALIASES[slug];
  if (alias) {
    return CULTURAL_PLACE_SLUG_IMAGE_OVERRIDES[alias] ?? null;
  }
  return null;
}

function resolveCulturalPlaceSlugEditorialFallback(slug: string): string | null {
  const direct = CULTURAL_PLACE_SLUG_EDITORIAL_FALLBACKS[slug];
  if (direct) return direct;
  const alias = CULTURAL_PLACE_SLUG_IMAGE_ALIASES[slug];
  if (alias) {
    return CULTURAL_PLACE_SLUG_EDITORIAL_FALLBACKS[alias] ?? null;
  }
  return null;
}

function resolveCulturalPlaceGalleryUrl(
  place: CulturalPlaceDisplaySource,
): string | null {
  for (const image of place.gallery_images ?? []) {
    const url = image.url?.trim();
    if (url && !isGenericCulturalPlaceholderUrl(url)) {
      return url;
    }
  }
  return null;
}

/** @deprecated Préférer resolveCulturalPlaceDisplayUrl — conservé pour imports existants. */
export function resolveCulturalPlaceImageOverride(
  place: Pick<CulturalPlaceListItem, "slug">,
): string | null {
  return resolveCulturalPlaceSlugImageOverride(place.slug);
}

export function resolveCulturalPlaceDisplayUrl(
  place: CulturalPlaceDisplaySource,
  variant: CulturalPlaceImageVariant = "hero",
): string | null {
  const override = resolveCulturalPlaceSlugImageOverride(place.slug);
  if (override) return override;

  const fromApi =
    variant === "thumbnail"
      ? resolveCulturalPlaceThumbnailUrl(place)
      : resolveCulturalPlaceHeroUrl(place);

  if (fromApi && !isGenericCulturalPlaceholderUrl(fromApi)) {
    return fromApi;
  }

  const alternate =
    variant === "thumbnail"
      ? resolveCulturalPlaceHeroUrl(place)
      : resolveCulturalPlaceThumbnailUrl(place);

  if (alternate && !isGenericCulturalPlaceholderUrl(alternate)) {
    return alternate;
  }

  const fromGallery = resolveCulturalPlaceGalleryUrl(place);
  if (fromGallery) {
    return fromGallery;
  }

  return resolveCulturalPlaceSlugEditorialFallback(place.slug);
}
