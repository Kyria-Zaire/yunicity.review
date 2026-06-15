import { JsonLd } from "@/components/seo/json-ld";
import { PlaceDetailScreen } from "@/components/places/place-detail-screen";
import {
  buildPageMetadata,
  plainTextExcerpt,
  truncateForMeta,
} from "@/lib/seo/metadata";
import { fetchPlaceOrPartnerForSeo } from "@/lib/seo/public-fetch";
import { resolveMediaUrl, SEO_DEFAULT_CITY } from "@/lib/seo/site";
import {
  buildPartnerBreadcrumbJsonLd,
  buildPartnerLocalBusinessJsonLd,
  buildPlaceBreadcrumbJsonLd,
  buildPlaceLocalBusinessJsonLd,
} from "@/lib/seo/structured-data";
import type { Metadata } from "next";

type PlaceDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PlaceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const city = query.city?.trim() || SEO_DEFAULT_CITY;
  const path = `/places/${slug}`;
  const entity = await fetchPlaceOrPartnerForSeo(slug, city);

  if (!entity) {
    return buildPageMetadata({
      title: "Lieu introuvable",
      description: "Ce lieu n'est pas disponible sur Yunicity.",
      path,
      noIndex: true,
    });
  }

  if (entity.kind === "partner") {
    const { partner } = entity;
    const description = truncateForMeta(
      plainTextExcerpt(partner.description) ||
        `Découvrez ${partner.name}, partenaire Yunicity à ${partner.city}.`,
    );
    const image = resolveMediaUrl(partner.cover_image_url || partner.logo_url);

    return buildPageMetadata({
      title: `${partner.name} — ${partner.city}`,
      description,
      path,
      image,
      imageAlt: partner.name,
    });
  }

  const { place } = entity;
  const title = `${place.name} — ${place.city}`;
  const description = truncateForMeta(
    place.short_description ||
      plainTextExcerpt(place.editorial_excerpt) ||
      plainTextExcerpt(place.description) ||
      `Découvrez ${place.name}, un lieu à ${place.city}, sur Yunicity.`,
  );
  const image = resolveMediaUrl(
    place.hero_image_url || place.image_url || place.thumbnail_image_url,
  );

  return buildPageMetadata({
    title,
    description,
    path,
    image,
    imageAlt: place.image_alt || place.name,
  });
}

export default async function PlaceDetailPage({ params, searchParams }: PlaceDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const city = query.city?.trim() || SEO_DEFAULT_CITY;
  const path = `/places/${slug}`;
  const entity = await fetchPlaceOrPartnerForSeo(slug, city);

  const jsonLd =
    entity?.kind === "cultural"
      ? [
          buildPlaceLocalBusinessJsonLd(entity.place, path),
          buildPlaceBreadcrumbJsonLd(entity.place, path),
        ]
      : entity?.kind === "partner"
        ? [
            buildPartnerLocalBusinessJsonLd(entity.partner, path),
            buildPartnerBreadcrumbJsonLd(entity.partner, path),
          ]
        : null;

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <PlaceDetailScreen slug={slug} city={query.city?.trim() ?? ""} />
    </>
  );
}
