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
const SITEMAP_LIST_LIMIT = 100;

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

export async function fetchSitemapDynamicEntries(): Promise<MetadataRoute.Sitemap> {
  const city = SEO_DEFAULT_CITY;
  const entries: MetadataRoute.Sitemap = [];

  const [places, creators, contents, events, neighborhoods] = await Promise.all([
    fetchPublicJson<CulturalPlaceListResponse>(
      apiUrl(`/cultural-places?${new URLSearchParams({ city, limit: String(SITEMAP_LIST_LIMIT) })}`),
    ),
    fetchPublicJson<CreatorPublicDirectoryListResponse>(
      apiUrl(`/public/creators?${new URLSearchParams({ city, limit: String(SITEMAP_LIST_LIMIT) })}`),
    ),
    fetchPublicJson<CreatorPublicListResponse>(
      apiUrl(`/creator-content?${new URLSearchParams({ city, limit: String(SITEMAP_LIST_LIMIT) })}`),
    ),
    fetchPublicJson<LocalEventListResponse>(
      apiUrl(
        `/events?${new URLSearchParams({
          city,
          page: "1",
          page_size: String(SITEMAP_LIST_LIMIT),
        })}`,
      ),
    ),
    fetchPublicJson<NeighborhoodListResponse>(
      apiUrl(
        `/neighborhoods?${new URLSearchParams({
          city,
          page: "1",
          page_size: String(SITEMAP_LIST_LIMIT),
        })}`,
      ),
    ),
  ]);

  for (const place of places?.items ?? []) {
    entries.push(toSitemapEntry(`/places/${place.slug}`, 0.75, "weekly"));
  }
  for (const creator of creators?.items ?? []) {
    entries.push(toSitemapEntry(`/creators/${creator.id}`, 0.7, "weekly"));
  }
  for (const content of contents?.items ?? []) {
    entries.push(toSitemapEntry(`/creator-content/${content.id}`, 0.65, "weekly"));
  }
  for (const event of events?.items ?? []) {
    entries.push(toSitemapEntry(`/events/${event.id}`, 0.8, "daily"));
  }
  for (const neighborhood of neighborhoods?.items ?? []) {
    entries.push(toSitemapEntry(`/neighborhoods/${neighborhood.slug}`, 0.65, "weekly"));
  }

  return entries;
}
