import type { CulturalPlaceListItem } from "@yunicity/types";
import { resolveCulturalPlaceImageOverride as resolveOverride } from "@yunicity/utils";

/** @deprecated Import depuis @yunicity/utils — conservé pour les imports web existants. */
export function resolveCulturalPlaceImageOverride(
  place: Pick<CulturalPlaceListItem, "slug">,
): string | null {
  return resolveOverride(place);
}
