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

/** URL Unsplash unique utilisée comme fallback seed `_wiki()` — à ignorer sauf cathédrale. */
export const GENERIC_CULTURAL_UNSPLASH_PHOTO_ID = "photo-1761983084378-6d63f5e996cb";

const CATHEDRAL_SLUG = "cathedrale-notre-dame";

/**
 * Images stables par slug (distinctes du placeholder générique).
 * Clés alignées sur `reims_cultural_places` + alias courants.
 */
const CULTURAL_PLACE_SLUG_IMAGE_OVERRIDES: Record<string, string> = {
  [CATHEDRAL_SLUG]:
    "https://cdn.elebase.io/173fe953-8a63-4a8a-8ca3-1bacb56d78a5/a016fa00-8eec-4399-bcb8-10f91b9acfd5-shutterstock_200545976.jpg?q=90",
  "porte-de-mars":
    "https://th.bing.com/th/id/OIP.gQdEGwtjmHxBpBuiRqxHTAHaEI?w=800&h=600&c=7&r=0&o=7&pid=1.7&rm=3",
  "bibliotheque-carnegie":
    "https://tse3.mm.bing.net/th/id/OIP.cLDw55L0jijFkgopwKjCAgHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  "basilique-saint-remi":
    "https://www.actualitix.com/wp-content/uploads/2016/11/basilique-saint-remi-a-reims.jpg",
  "musee-des-beaux-arts":
    "https://th.bing.com/th/id/OIP.hp2aszpxkbRTCe5IVMvDJgHaEL?w=800&h=500&c=7&r=0&o=7&pid=1.7&rm=3",
  "palais-du-tau":
    "https://img-4.linternaute.com/uQ_yW33guQHqdZTQdtIaFMhcK2Y=/1240x/smart/f4cad198146d41eb91fb8a9859ce5adc/ccmcms-linternaute/18659868.jpg",
  cryptoportique:
    "https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=900&q=80",
  // SEED-PROD-01A: opera-de-reims override removed (Unsplash URL now 404). With no
  // override, resolveCulturalPlaceDisplayUrl returns null (the DB cover.jpg is a
  // pending yunicity-hosted placeholder, filtered out) → clean gradient + name fallback.
  "halles-boulingrin":
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
  "halles-du-boulingrin":
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
  "domaine-pommery":
    "https://images.unsplash.com/photo-1510812431401-41d2bd2724f3?auto=format&fit=crop&w=900&q=80",
  "musee-saint-remi":
    "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=900&q=80",
  "parc-de-champagne":
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
  "place-royale":
    "https://images.unsplash.com/photo-1467269209834-ffaff5f779eb?auto=format&fit=crop&w=900&q=80",
  "place-erlon":
    "https://images.unsplash.com/photo-1449824913935-59a10b85d9bf?auto=format&fit=crop&w=900&q=80",
  "villa-demoiselle":
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80",
  // SEED-PROD-01A: frac-grand-est override removed (Unsplash URL now 404) → null → fallback.
  "planetarium-de-reims":
    "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=900&q=80",
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

  if (place.slug === CATHEDRAL_SLUG && fromApi) {
    return fromApi;
  }

  return null;
}
