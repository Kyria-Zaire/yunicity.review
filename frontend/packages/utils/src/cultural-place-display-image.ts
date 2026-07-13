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
  CulturalPlaceImageSource;

/** URL Unsplash unique utilisée comme fallback seed `_wiki()` — placeholder générique à ignorer. */
export const GENERIC_CULTURAL_UNSPLASH_PHOTO_ID = "photo-1761983084378-6d63f5e996cb";

/**
 * Overrides d'images par slug — UNIQUEMENT pour les lieux culturels NON traités par SEED-PROD-01B.
 * Les 12 lieux servis depuis R2/CDN (`media.yunicity.city/places/reims/{slug}/cover.jpg`) ont été
 * retirés : leur source de vérité est désormais l'API `cultural_places`. Ne pas réintroduire ici
 * un slug qui possède une cover R2 officielle — l'API doit primer (cf. fix/web-cultural-covers-display).
 */
const CULTURAL_PLACE_SLUG_IMAGE_OVERRIDES: Record<string, string> = {
  "bibliotheque-carnegie":
    "https://tse3.mm.bing.net/th/id/OIP.cLDw55L0jijFkgopwKjCAgHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  "domaine-pommery":
    "https://images.unsplash.com/photo-1510812431401-41d2bd2724f3?auto=format&fit=crop&w=900&q=80",
  "place-royale":
    "https://images.unsplash.com/photo-1467269209834-ffaff5f779eb?auto=format&fit=crop&w=900&q=80",
  "place-erlon":
    "https://images.unsplash.com/photo-1449824913935-59a10b85d9bf?auto=format&fit=crop&w=900&q=80",
  "villa-demoiselle":
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80",
};

export type CulturalPlaceImageVariant = "hero" | "thumbnail";

export function isGenericCulturalPlaceholderUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  return trimmed.includes(GENERIC_CULTURAL_UNSPLASH_PHOTO_ID);
}

export function resolveCulturalPlaceSlugImageOverride(
  slug: string,
): string | null {
  return CULTURAL_PLACE_SLUG_IMAGE_OVERRIDES[slug] ?? null;
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

  return null;
}
