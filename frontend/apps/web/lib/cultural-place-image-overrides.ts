import type { CulturalPlaceListItem } from "@yunicity/types";
import { resolveCulturalPlaceSlugImageOverride } from "@yunicity/utils";

/** @deprecated Préférer resolveCulturalPlaceDisplayUrl depuis @yunicity/utils. */
export function resolveCulturalPlaceImageOverride(
  place: Pick<CulturalPlaceListItem, "slug">,
): string | null {
  return resolveCulturalPlaceSlugImageOverride(place.slug);
}
