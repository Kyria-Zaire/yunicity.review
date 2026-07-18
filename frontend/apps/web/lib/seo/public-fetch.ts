import type {
  CreatorPublicDetailResponse,
  CreatorPublicDirectoryListResponse,
  CreatorPublicListResponse,
  CreatorPublicProfile,
  CulturalPlaceDetail,
  CulturalPlaceListResponse,
  LocalEvent,
  LocalEventListResponse,
  NeighborhoodDetail,
  NeighborhoodListResponse,
  PartnerPublic,
} from "@yunicity/types";
import { getWebApiBaseUrl } from "@yunicity/utils";
import type { MetadataRoute } from "next";

import { getAbsoluteUrl, SEO_DEFAULT_CITY } from "./site";

const REVALIDATE_SECONDS = 300;

// Taille de page. Doit rester <= au plafond le plus bas des endpoints listés ci-dessous.
// Ils plafonnent tous a 50 (CREATOR_HUB_LIST_LIMIT_MAX, CREATOR_DIRECTORY_LIST_LIMIT_MAX,
// NEIGHBORHOOD_LIST_PAGE_SIZE_MAX, LOCAL_EVENT_LIST_PAGE_SIZE_MAX) ; seul /cultural-places
// accepte 100. Demander plus renvoie 422, que fetchPublicJson convertit en null puis en liste
// vide : le sitemap s'ampute alors sans aucune erreur visible (PROD-BUG-01).
const SITEMAP_LIST_LIMIT = 50;

// Plafond de securite : 20 x 50 = 1000 entrees par type. Borne la boucle si un endpoint
// renvoyait un `total` qui ne converge jamais. L'atteindre est signale bruyamment plus bas
// — c'est l'objet de PROD-BUG-02 : une troncature doit s'entendre, pas se deviner.
const SITEMAP_MAX_PAGES = 20;

function apiUrl(segment: string): string {
  const base = getWebApiBaseUrl();
  const normalized = segment.startsWith("/") ? segment : `/${segment}`;
  return `${base}/api/v1${normalized}`;
}

async function fetchPublicJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchPlaceForSeo(
  slug: string,
  city = SEO_DEFAULT_CITY,
): Promise<CulturalPlaceDetail | null> {
  const search = new URLSearchParams({ city });
  return fetchPublicJson<CulturalPlaceDetail>(
    apiUrl(`/cultural-places/${encodeURIComponent(slug)}?${search}`),
  );
}

export async function fetchPartnerForSeo(
  slug: string,
  city = SEO_DEFAULT_CITY,
): Promise<PartnerPublic | null> {
  const search = new URLSearchParams({ city });
  return fetchPublicJson<PartnerPublic>(
    apiUrl(`/partners/${encodeURIComponent(slug)}?${search}`),
  );
}

/**
 * Résout l'entité SEO d'un slug `/places/[slug]` : lieu culturel en priorité,
 * sinon partenaire (les deux probes sont lancés en parallèle). Évite le titre
 * « Lieu introuvable » sur les pages partenaires réelles.
 */
export type PlaceSeoEntity =
  | { kind: "cultural"; place: CulturalPlaceDetail }
  | { kind: "partner"; partner: PartnerPublic };

export async function fetchPlaceOrPartnerForSeo(
  slug: string,
  city = SEO_DEFAULT_CITY,
): Promise<PlaceSeoEntity | null> {
  const [culturalRes, partnerRes] = await Promise.allSettled([
    fetchPlaceForSeo(slug, city),
    fetchPartnerForSeo(slug, city),
  ]);

  const place = culturalRes.status === "fulfilled" ? culturalRes.value : null;
  if (place) {
    return { kind: "cultural", place };
  }
  const partner = partnerRes.status === "fulfilled" ? partnerRes.value : null;
  if (partner) {
    return { kind: "partner", partner };
  }
  return null;
}

export async function fetchCreatorProfileForSeo(creatorId: string): Promise<CreatorPublicProfile | null> {
  return fetchPublicJson<CreatorPublicProfile>(
    apiUrl(`/public/creators/${encodeURIComponent(creatorId.trim())}`),
  );
}

export async function fetchCreatorContentForSeo(
  contentId: string,
): Promise<CreatorPublicDetailResponse | null> {
  return fetchPublicJson<CreatorPublicDetailResponse>(
    apiUrl(`/creator-content/${encodeURIComponent(contentId.trim())}`),
  );
}

export async function fetchEventForSeo(eventId: string): Promise<LocalEvent | null> {
  return fetchPublicJson<LocalEvent>(apiUrl(`/events/${encodeURIComponent(eventId.trim())}`));
}

export async function fetchNeighborhoodForSeo(
  slug: string,
  city = SEO_DEFAULT_CITY,
): Promise<NeighborhoodDetail | null> {
  const search = new URLSearchParams({ city });
  return fetchPublicJson<NeighborhoodDetail>(
    apiUrl(`/neighborhoods/${encodeURIComponent(slug)}?${search}`),
  );
}

function toSitemapEntry(
  path: string,
  priority = 0.7,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly",
): MetadataRoute.Sitemap[number] {
  return {
    url: getAbsoluteUrl(path),
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

/**
 * Parcourt toutes les pages d'un endpoint de liste.
 *
 * S'arrete sur `total`, que les cinq endpoints exposent, plutot que sur « la page est
 * pleine » : `total` est une reponse, l'heuristique est une supposition qui se trompe
 * exactement quand le nombre d'entites est un multiple de la taille de page.
 *
 * Deux fins silencieuses sont assumees et distinctes du cas bruyant :
 * - `fetchPage` renvoie null (fetchPublicJson a deja avale l'erreur) : on garde les pages
 *   deja collectees plutot que de retirer tout le type du sitemap ;
 * - `items` revient vide alors que `total` promettait plus : on n'insiste pas.
 *
 * Atteindre SITEMAP_MAX_PAGES sans avoir tout collecte est en revanche signale (voir
 * PROD-BUG-02 : le but du ticket n'est pas de repousser le seuil, c'est que le franchir
 * s'entende).
 */
async function fetchAllPages<T>(
  source: string,
  fetchPage: (pageIndex: number) => Promise<{ items: T[]; total: number } | null>,
): Promise<T[]> {
  const collected: T[] = [];
  let total = 0;

  for (let pageIndex = 0; pageIndex < SITEMAP_MAX_PAGES; pageIndex += 1) {
    const page = await fetchPage(pageIndex);
    if (!page) {
      return collected;
    }
    total = page.total;
    collected.push(...page.items);
    if (page.items.length === 0 || collected.length >= total) {
      return collected;
    }
  }

  // Nom d'evenement stable et greppable, meme convention que le backend
  // (`rate_limit_backend_unavailable`). Pas de logger structure dans apps/web, et en
  // introduire un pour un seul avertissement serait disproportionne.
  console.warn(
    `sitemap_truncated source=${source} collected=${collected.length} total=${total} ` +
      `max_pages=${SITEMAP_MAX_PAGES} page_size=${SITEMAP_LIST_LIMIT}`,
  );
  return collected;
}

export async function fetchSitemapDynamicEntries(): Promise<MetadataRoute.Sitemap> {
  const city = SEO_DEFAULT_CITY;
  const entries: MetadataRoute.Sitemap = [];

  // Deux styles de pagination coexistent cote backend : limit/offset pour cultural-places,
  // public/creators et creator-content ; page/page_size pour events et neighborhoods. Le
  // callback recoit un index de page et chaque appelant le traduit dans son style.
  const [places, creators, contents, events, neighborhoods] = await Promise.all([
    fetchAllPages("cultural-places", (pageIndex) =>
      fetchPublicJson<CulturalPlaceListResponse>(
        apiUrl(
          `/cultural-places?${new URLSearchParams({
            city,
            limit: String(SITEMAP_LIST_LIMIT),
            offset: String(pageIndex * SITEMAP_LIST_LIMIT),
          })}`,
        ),
      ),
    ),
    fetchAllPages("public-creators", (pageIndex) =>
      fetchPublicJson<CreatorPublicDirectoryListResponse>(
        apiUrl(
          `/public/creators?${new URLSearchParams({
            city,
            limit: String(SITEMAP_LIST_LIMIT),
            offset: String(pageIndex * SITEMAP_LIST_LIMIT),
          })}`,
        ),
      ),
    ),
    fetchAllPages("creator-content", (pageIndex) =>
      fetchPublicJson<CreatorPublicListResponse>(
        apiUrl(
          `/creator-content?${new URLSearchParams({
            city,
            limit: String(SITEMAP_LIST_LIMIT),
            offset: String(pageIndex * SITEMAP_LIST_LIMIT),
          })}`,
        ),
      ),
    ),
    fetchAllPages("events", (pageIndex) =>
      fetchPublicJson<LocalEventListResponse>(
        apiUrl(
          `/events?${new URLSearchParams({
            city,
            page: String(pageIndex + 1),
            page_size: String(SITEMAP_LIST_LIMIT),
          })}`,
        ),
      ),
    ),
    fetchAllPages("neighborhoods", (pageIndex) =>
      fetchPublicJson<NeighborhoodListResponse>(
        apiUrl(
          `/neighborhoods?${new URLSearchParams({
            city,
            page: String(pageIndex + 1),
            page_size: String(SITEMAP_LIST_LIMIT),
          })}`,
        ),
      ),
    ),
  ]);

  for (const place of places) {
    entries.push(toSitemapEntry(`/places/${place.slug}`, 0.75, "weekly"));
  }
  for (const creator of creators) {
    entries.push(toSitemapEntry(`/creators/${creator.id}`, 0.7, "weekly"));
  }
  for (const content of contents) {
    entries.push(toSitemapEntry(`/creator-content/${content.id}`, 0.65, "weekly"));
  }
  for (const event of events) {
    entries.push(toSitemapEntry(`/events/${event.id}`, 0.8, "daily"));
  }
  for (const neighborhood of neighborhoods) {
    entries.push(toSitemapEntry(`/neighborhoods/${neighborhood.slug}`, 0.65, "weekly"));
  }

  return entries;
}
