/**
 * Public place routing (WEB-PARTNERS-02).
 *
 * `/places/{slug}` resolves in order:
 * 1. cultural_place (patrimoine / lieux emblématiques) — priorité en cas de collision de slug
 * 2. signed partner organization (commerce / partenaire actif)
 */

export type PlaceSlugKind = "cultural" | "partner";

export function buildPublicPlaceHref(slug: string, city: string): string {
  const params = new URLSearchParams();
  const cleanSlug = slug.trim();
  const cleanCity = city.trim();
  if (cleanCity) params.set("city", cleanCity);
  const query = params.toString();
  return query ? `/places/${encodeURIComponent(cleanSlug)}?${query}` : `/places/${encodeURIComponent(cleanSlug)}`;
}
