import { NeighborhoodDetailScreen } from "@/components/neighborhoods/neighborhood-detail-screen";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata, plainTextExcerpt, truncateForMeta } from "@/lib/seo/metadata";
import { fetchNeighborhoodForSeo } from "@/lib/seo/public-fetch";
import { SEO_DEFAULT_CITY, resolveMediaUrl } from "@/lib/seo/site";
import { buildNeighborhoodBreadcrumbJsonLd } from "@/lib/seo/structured-data";
import type { Metadata } from "next";

type NeighborhoodDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: NeighborhoodDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const city = query.city?.trim() || SEO_DEFAULT_CITY;
  const path = `/neighborhoods/${slug}`;
  const neighborhood = await fetchNeighborhoodForSeo(slug, city);

  if (!neighborhood) {
    return buildPageMetadata({
      title: "Quartier introuvable",
      description: "Ce quartier n'est pas disponible sur Yunicity.",
      path,
      noIndex: true,
    });
  }

  const title = `${neighborhood.display_name} — quartier à ${neighborhood.city}`;
  const description = truncateForMeta(
    plainTextExcerpt(neighborhood.short_description) ||
      plainTextExcerpt(neighborhood.ambiance) ||
      `Découvrez le quartier ${neighborhood.display_name} à ${neighborhood.city} sur Yunicity.`,
  );
  const image = resolveMediaUrl(neighborhood.cover_image_url);

  return buildPageMetadata({
    title,
    description,
    path,
    image,
    imageAlt: neighborhood.display_name,
  });
}

export default async function NeighborhoodDetailPage({
  params,
  searchParams,
}: NeighborhoodDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const city = query.city?.trim() || SEO_DEFAULT_CITY;
  const path = `/neighborhoods/${slug}`;
  const neighborhood = await fetchNeighborhoodForSeo(slug, city);

  return (
    <>
      {neighborhood ? <JsonLd data={buildNeighborhoodBreadcrumbJsonLd(neighborhood, path)} /> : null}
      <NeighborhoodDetailScreen slug={slug} city={city} />
    </>
  );
}
